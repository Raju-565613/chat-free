const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { requireAuth, requireNonGuest } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireNonGuest);

router.get('/:username', (req, res) => {
  const other = req.params.username;
  if (!db.areFriends(req.user.username, other)) {
    return res.status(403).json({ error: 'You can only message friends.' });
  }
  const history = db.getDirectMessages(req.user.username, other, 200).map((m) => ({
    ...m,
    displayName: db.getDisplayName(m.from),
  }));
  res.json({ history });
});

// ---------- File / image sharing in DMs ----------

const dmUploadRoot = path.join(__dirname, '..', '..', 'uploads', 'dm');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // SECURITY: this callback runs while multer is still parsing the
    // multipart stream, before the route handler's checks below -- so the
    // recipient must be validated *here* too. Also guards against the field
    // ever arriving in the wrong order (text fields must precede the file
    // field in the FormData for req.body to be populated yet).
    const to = String(req.body.to || '');
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(to)) {
      return cb(new Error('Missing or invalid recipient.'));
    }
    const pair = [req.user.username, to].sort().join('__');
    const dir = path.join(dmUploadRoot, pair);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safe);
  },
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB cap

router.post('/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Upload failed.' });

    const to = (req.body.to || '').trim();
    if (!to) return res.status(400).json({ error: 'Missing recipient.' });
    if (!db.areFriends(req.user.username, to)) {
      return res.status(403).json({ error: 'You can only message friends.' });
    }
    if (!req.file) return res.status(400).json({ error: 'No file received.' });

    const pair = [req.user.username, to].sort().join('__');
    const relPath = `/uploads/dm/${pair}/${req.file.filename}`;

    const message = db.createDirectMessage({
      from: req.user.username,
      to,
      file_path: relPath,
      file_name: req.file.originalname,
    });
    const outgoing = { ...message, displayName: db.getDisplayName(message.from) };

    const io = req.app.get('io');
    const targetUser = db.getUserByName(to);
    io.to(`user:${req.user.id}`).emit('dm:message', outgoing);
    if (targetUser) io.to(`user:${targetUser.id}`).emit('dm:message', outgoing);

    res.status(201).json(outgoing);
  });
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
function emitToBoth(req, message) {
  const io = req.app.get('io');
  const other = message.from === req.user.username ? message.to : message.from;
  const otherUser = db.getUserByName(other);
  io.to(`user:${req.user.id}`).emit('dm:message:edited', message);
  if (otherUser) io.to(`user:${otherUser.id}`).emit('dm:message:edited', message);
}

router.patch('/messages/:id', (req, res) => {
  const content = (req.body && req.body.content ? String(req.body.content) : '').trim();
  if (!content) return res.status(400).json({ error: 'Message cannot be empty.' });

  const result = db.editDirectMessage(Number(req.params.id), req.user.username, content);
  if (sendEditResult(res, result)) return;

  emitToBoth(req, result.message);
  res.json(result.message);
});

router.delete('/messages/:id', (req, res) => {
  const result = db.deleteDirectMessage(Number(req.params.id), req.user.username);
  if (sendEditResult(res, result)) return;

  const io = req.app.get('io');
  const other = result.message.from === req.user.username ? result.message.to : result.message.from;
  const otherUser = db.getUserByName(other);
  io.to(`user:${req.user.id}`).emit('dm:message:deleted', { id: result.message.id });
  if (otherUser) io.to(`user:${otherUser.id}`).emit('dm:message:deleted', { id: result.message.id });
  res.json({ ok: true });
});

module.exports = router;
