const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { requireAuth, requireNonGuest } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireNonGuest);

// Channel photo uploads (WhatsApp-group-style) -- separate from message
// file uploads further below, since these go in their own folder and only
// accept images.
const channelPhotoRoot = path.join(__dirname, '..', '..', 'uploads', 'outchat-photos');
fs.mkdirSync(channelPhotoRoot, { recursive: true });
const photoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, channelPhotoRoot),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, '') || '.jpg';
      cb(null, `${req.params.id}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(png|jpe?g|gif|webp)$/.test(file.mimetype)) {
      return cb(new Error('Please upload a PNG, JPG, GIF, or WEBP image.'));
    }
    cb(null, true);
  },
});

function channelSummary(channel, membership) {
  return {
    id: channel.id,
    name: channel.name,
    description: channel.description || '',
    photo: channel.photo || null,
    ownerUsername: channel.ownerUsername,
    inviteCode: channel.inviteCode,
    createdAt: channel.created_at,
    myRole: membership ? membership.role : null,
  };
}

// List channels the current user belongs to.
router.get('/channels', (req, res) => {
  res.json({ channels: db.listChannelsForUser(req.user.username) });
});

// Create a new channel. Creator becomes owner automatically.
router.post('/channels', (req, res) => {
  const name = (req.body && req.body.name ? req.body.name : '').trim();
  if (!name) return res.status(400).json({ error: 'Give your channel a name.' });

  const channel = db.createChannel(name, req.user.username);
  res.status(201).json({ channel: channelSummary(channel, { role: 'owner' }) });
});

// Request to join via invite code. Owner must approve before access.
router.post('/channels/join', (req, res) => {
  const code = (req.body && req.body.code ? req.body.code : '').trim();
  const channel = db.getChannelByInvite(code);
  if (!channel) return res.status(404).json({ error: 'Invalid or expired invite code.' });

  const existing = db.getMembership(channel.id, req.user.username);
  if (existing && existing.status === 'approved') {
    return res.status(200).json({ ok: true, alreadyMember: true, channel: channelSummary(channel, existing) });
  }
  if (existing && existing.status === 'pending') {
    return res.status(202).json({ ok: true, pending: true });
  }

  db.addMembership(channel.id, req.user.username, 'member', 'pending');

  const io = req.app.get('io');
  const owner = db.getUserByName(channel.ownerUsername);
  if (owner) {
    io.to(`user:${owner.id}`).emit('outchat:join-request', {
      channelId: channel.id,
      channelName: channel.name,
      username: req.user.username,
    });
  }

  res.status(202).json({ ok: true, pending: true, channelName: channel.name });
});

// Details for one channel: members, and pending requests if you're the owner.
router.get('/channels/:id', (req, res) => {
  const channel = db.getChannelById(req.params.id);
  const membership = channel && db.getMembership(channel.id, req.user.username);

  if (!channel || !membership || membership.status !== 'approved') {
    return res.status(404).json({ error: "Channel not found or you don't have access." });
  }

  const members = db.listApprovedMembers(channel.id).map((m) => {
    const u = db.getUserByName(m.username);
    return { username: m.username, role: m.role, avatarColor: u ? u.avatarColor : '#f2c14e' };
  });
  const pending = membership.role === 'owner' ? db.listPendingMembers(channel.id) : [];
  const history = db.getChannelMessages(channel.id, 200).map((m) => ({
    ...m,
    displayName: db.getDisplayName(m.username),
  }));

  res.json({ channel: channelSummary(channel, membership), members, pending, history });
});

// Owner edits the channel's name/description -- WhatsApp-group-style profile.
router.patch('/channels/:id', (req, res) => {
  const channel = db.getChannelById(req.params.id);
  const membership = channel && db.getMembership(channel.id, req.user.username);
  if (!channel || !membership || membership.role !== 'owner') {
    return res.status(403).json({ error: 'Only the owner can edit the channel profile.' });
  }
  const { name, description } = req.body || {};
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: 'Channel name cannot be empty.' });
  }
  const updated = db.updateChannelProfile(channel.id, {
    name: name !== undefined ? name.trim() : undefined,
    description: description !== undefined ? description.trim() : undefined,
  });
  res.json({ channel: channelSummary(updated, membership) });
});

// Owner uploads a channel photo.
router.post('/channels/:id/photo', (req, res, next) => {
  const channel = db.getChannelById(req.params.id);
  const membership = channel && db.getMembership(channel.id, req.user.username);
  if (!channel || !membership || membership.role !== 'owner') {
    return res.status(403).json({ error: 'Only the owner can change the channel photo.' });
  }
  next();
}, photoUpload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image received.' });
  const relPath = `/uploads/outchat-photos/${req.file.filename}`;
  const updated = db.updateChannelProfile(req.params.id, { photo: relPath });
  res.status(201).json({ photo: updated.photo });
});

// Owner approves a pending join request.
router.post('/channels/:id/approve', (req, res) => {
  const channel = db.getChannelById(req.params.id);
  if (!channel || channel.ownerUsername !== req.user.username) {
    return res.status(403).json({ error: 'Only the owner can approve requests.' });
  }
  const { username } = req.body || {};
  const membership = db.getMembership(channel.id, username);
  if (!membership || membership.status !== 'pending') {
    return res.status(404).json({ error: 'No pending request from that user.' });
  }

  db.addMembership(channel.id, username, 'member', 'approved');

  const io = req.app.get('io');
  const target = db.getUserByName(username);
  if (target) {
    io.to(`user:${target.id}`).emit('outchat:approved', { channelId: channel.id, channelName: channel.name });
  }

  res.json({ ok: true });
});

// Owner rejects a pending join request.
router.post('/channels/:id/reject', (req, res) => {
  const channel = db.getChannelById(req.params.id);
  if (!channel || channel.ownerUsername !== req.user.username) {
    return res.status(403).json({ error: 'Only the owner can reject requests.' });
  }
  const { username } = req.body || {};
  db.removeMembership(channel.id, username);
  res.json({ ok: true });
});

// Owner kicks an existing (approved) member. Owner cannot kick themself.
router.post('/channels/:id/kick', (req, res) => {
  const channel = db.getChannelById(req.params.id);
  if (!channel || channel.ownerUsername !== req.user.username) {
    return res.status(403).json({ error: 'Only the owner can remove members.' });
  }
  const { username } = req.body || {};
  if (username === req.user.username) {
    return res
      .status(400)
      .json({ error: "You can't kick yourself. Transfer ownership or leave instead." });
  }

  db.removeMembership(channel.id, username);

  const io = req.app.get('io');
  const target = db.getUserByName(username);
  if (target) {
    io.to(`user:${target.id}`).emit('outchat:kicked', { channelId: channel.id, channelName: channel.name });
  }
  io.to(`outchat:${channel.id}`).emit('outchat:member-removed', { username });

  res.json({ ok: true });
});

// Owner transfers ownership to another approved member.
router.post('/channels/:id/transfer', (req, res) => {
  const channel = db.getChannelById(req.params.id);
  if (!channel || channel.ownerUsername !== req.user.username) {
    return res.status(403).json({ error: 'Only the owner can transfer ownership.' });
  }
  const { username } = req.body || {};
  const targetMembership = db.getMembership(channel.id, username);
  if (!targetMembership || targetMembership.status !== 'approved') {
    return res.status(404).json({ error: 'That user is not a member of this channel.' });
  }

  const updated = db.transferOwnership(channel.id, req.user.username, username);

  const io = req.app.get('io');
  const target = db.getUserByName(username);
  if (target) {
    io.to(`user:${target.id}`).emit('outchat:ownership-transferred', {
      channelId: channel.id,
      channelName: channel.name,
    });
  }

  res.json({ ok: true, channel: updated });
});

// ---------- File / image sharing in a channel ----------

const channelUploadRoot = path.join(__dirname, '..', '..', 'uploads', 'outchat');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // SECURITY: multer's destination callback runs during multipart parsing,
    // before the route handler's authorization/membership check below --
    // so the raw URL param must be validated *here*, not just later, or a
    // crafted :id (e.g. containing "../") could write files outside
    // uploads/outchat/ entirely. Channel IDs are always "ch_<number>".
    if (!/^ch_\d+$/.test(String(req.params.id))) {
      return cb(new Error('Invalid channel.'));
    }
    const dir = path.join(channelUploadRoot, req.params.id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safe);
  },
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB cap

router.post('/channels/:id/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message === 'Invalid channel.' ? err.message : 'Upload failed.' });

    const channel = db.getChannelById(req.params.id);
    const membership = channel && db.getMembership(channel.id, req.user.username);
    if (!channel || !membership || membership.status !== 'approved') {
      return res.status(403).json({ error: 'You are not a member of this channel.' });
    }
    if (!req.file) return res.status(400).json({ error: 'No file received.' });

    const relPath = `/uploads/outchat/${channel.id}/${req.file.filename}`;
    const message = db.createChannelMessage({
      channelId: channel.id,
      username: req.user.username,
      file_path: relPath,
      file_name: req.file.originalname,
    });
    const outgoing = { ...message, displayName: db.getDisplayName(message.username) };

    const io = req.app.get('io');
    io.to(`outchat:${channel.id}`).emit('outchat:message', outgoing);

    res.status(201).json(outgoing);
  });
});

// Any member (including the owner) can leave. If the owner leaves while
// members remain, ownership transfers to the longest-standing member first;
// if they were the last member, the channel is deleted entirely.
router.post('/channels/:id/leave', (req, res) => {
  const channel = db.getChannelById(req.params.id);
  const membership = channel && db.getMembership(channel.id, req.user.username);
  if (!channel || !membership) return res.status(404).json({ error: 'Channel not found.' });

  const isOwner = channel.ownerUsername === req.user.username;
  const others = db.listApprovedMembers(channel.id).filter((m) => m.username !== req.user.username);

  if (isOwner && others.length > 0) {
    // Transfer while the old owner's membership still exists, then remove it.
    db.transferOwnership(channel.id, req.user.username, others[0].username);
    db.removeMembership(channel.id, req.user.username);
  } else if (isOwner) {
    db.deleteChannel(channel.id);
  } else {
    db.removeMembership(channel.id, req.user.username);
  }

  res.json({ ok: true });
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

router.patch('/messages/:id', (req, res) => {
  const content = (req.body && req.body.content ? String(req.body.content) : '').trim();
  if (!content) return res.status(400).json({ error: 'Message cannot be empty.' });

  const result = db.editChannelMessage(Number(req.params.id), req.user.username, content);
  if (sendEditResult(res, result)) return;

  req.app.get('io').to(`outchat:${result.message.channelId}`).emit('outchat:message:edited', result.message);
  res.json(result.message);
});

router.delete('/messages/:id', (req, res) => {
  const result = db.deleteChannelMessage(Number(req.params.id), req.user.username);
  if (sendEditResult(res, result)) return;

  req.app.get('io').to(`outchat:${result.message.channelId}`).emit('outchat:message:deleted', {
    id: result.message.id,
    channelId: result.message.channelId,
  });
  res.json({ ok: true });
});

module.exports = router;
