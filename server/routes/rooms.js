const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { resolveRoom, slugifyRoomName, OVERRIDE_COOKIE } = require('../rooms');

const router = express.Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
};

// --- Current room + history -------------------------------------------------

router.get('/current', requireAuth, (req, res) => {
  const room = resolveRoom(req);
  const history = db.getMessagesByRoom(room.id, 200).map((m) => ({
    ...m,
    displayName: db.getDisplayName(m.username),
  }));

  res.json({ room, history });
});

// --- Manual override ---------------------------------------------------------

router.post('/override', requireAuth, (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Enter a room name.' });
  }
  res.cookie(OVERRIDE_COOKIE, name.trim(), COOKIE_OPTS);
  res.json({ ok: true, slug: slugifyRoomName(name) });
});

router.post('/reset', requireAuth, (req, res) => {
  res.clearCookie(OVERRIDE_COOKIE);
  res.json({ ok: true });
});

// --- Report -------------------------------------------------------------------

router.get('/report', requireAuth, (req, res) => {
  const room = resolveRoom(req);
  const reports = db.getReportsByRoom(room.id, 50);

  // Group reports by the user they're against, most-reported first --
  // this is the part that actually surfaces problem users, rather than
  // just a flat activity count.
  const byUser = {};
  reports.forEach((r) => {
    if (!byUser[r.reported_username]) byUser[r.reported_username] = [];
    byUser[r.reported_username].push(r);
  });
  const flaggedUsers = Object.entries(byUser)
    .map(([username, userReports]) => ({
      username,
      count: userReports.length,
      lastReason: userReports[0].reason,
      lastAt: userReports[0].created_at,
    }))
    .sort((a, b) => b.count - a.count);

  res.json({
    room,
    messageCount: db.countMessages(room.id),
    fileCount: db.countFiles(room.id),
    activeUsers: db.countActiveUsers(room.id),
    firstActivity: db.firstActivity(room.id, room.created_at),
    flaggedUsers,
    recentReports: reports.slice(0, 20),
  });
});

// A user flags a specific message (and, by extension, its sender) for
// review. Anyone in the room can see the resulting flagged-users list via
// GET /report, since there's no separate admin role in this starter app.
router.post('/report-user', requireAuth, (req, res) => {
  const { messageId, reason, details } = req.body || {};

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Choose a reason for the report.' });
  }

  const room = resolveRoom(req);
  const message = messageId ? db.getMessageById(Number(messageId)) : null;

  if (messageId && (!message || message.room_id !== room.id)) {
    return res.status(404).json({ error: 'That message could not be found in this room.' });
  }
  if (message && message.username === req.user.username) {
    return res.status(400).json({ error: "You can't report your own message." });
  }

  const report = db.createReport({
    room_id: room.id,
    message_id: message ? message.id : null,
    reported_username: message ? message.username : (req.body.username || '').trim(),
    reporter_username: req.user.username,
    reason: reason.trim(),
    details: (details || '').trim().slice(0, 500),
  });

  if (!report.reported_username) {
    return res.status(400).json({ error: 'No user to report.' });
  }

  res.status(201).json({ ok: true, report });
});

// --- File uploads, scoped per room -------------------------------------------

const uploadRoot = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const room = resolveRoom(req);
    const dir = path.join(uploadRoot, room.id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safe);
  },
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB cap

router.post('/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received.' });

  const room = resolveRoom(req);
  const relPath = `/uploads/${room.id}/${req.file.filename}`;

  const message = db.createMessage({
    room_id: room.id,
    user_id: req.user.id,
    username: req.user.username,
    file_path: relPath,
    file_name: req.file.originalname,
  });

  const io = req.app.get('io');
  io.to(room.id).emit('chat:message', message);

  res.status(201).json(message);
});

const EDIT_ERROR_MESSAGES = {
  not_found: [404, 'Message not found.'],
  forbidden: [403, 'You can only edit or delete your own messages.'],
  deleted: [400, 'This message was already deleted.'],
  expired: [403, 'The 1-minute edit window has passed.'],
  not_text: [400, "File and image messages can't be edited, only deleted."],
};
function sendEditResult(res, result) {
  if (result.error) {
    const [status, message] = EDIT_ERROR_MESSAGES[result.error] || [400, 'Could not update message.'];
    return res.status(status).json({ error: message });
  }
  return null;
}

router.patch('/messages/:id', requireAuth, (req, res) => {
  const content = (req.body && req.body.content ? String(req.body.content) : '').trim();
  if (!content) return res.status(400).json({ error: 'Message cannot be empty.' });

  const result = db.editRoomMessage(Number(req.params.id), req.user.username, content);
  if (sendEditResult(res, result)) return;

  req.app.get('io').to(result.message.room_id).emit('chat:message:edited', result.message);
  res.json(result.message);
});

router.delete('/messages/:id', requireAuth, (req, res) => {
  const result = db.deleteRoomMessage(Number(req.params.id), req.user.username);
  if (sendEditResult(res, result)) return;

  req.app.get('io').to(result.message.room_id).emit('chat:message:deleted', { id: result.message.id });
  res.json({ ok: true });
});

module.exports = router;
