const express = require('express');
const db = require('../db');
const { requireAuth, requireNonGuest } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireNonGuest);

router.get('/', (req, res) => {
  const me = req.user.username;
  const starred = db.getStarredSet(me);
  const friends = db
    .listFriends(me)
    .map((username) => {
      const u = db.getUserByName(username);
      return {
        username,
        displayName: (u && u.displayName) || username,
        avatarColor: u ? u.avatarColor : '#39ff6e',
        avatarImage: u ? u.avatarImage || null : null,
        starred: starred.has(username),
      };
    })
    .sort((a, b) => Number(b.starred) - Number(a.starred));
  const incoming = db.listIncomingRequests(me);
  const outgoing = db.listOutgoingRequests(me);
  res.json({ friends, incoming, outgoing });
});

router.post('/star', (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: 'Missing username.' });
  if (!db.areFriends(req.user.username, username)) {
    return res.status(403).json({ error: 'You can only star a friend.' });
  }
  res.json(db.toggleStarredFriend(req.user.username, username));
});

router.post('/request', (req, res) => {
  const me = req.user.username;
  const target = (req.body && req.body.username ? req.body.username : '').trim().replace(/^@/, '');

  if (!target) {
    return res.status(400).json({ error: 'Enter a valid username or account ID.' });
  }
  const targetUser = db.getUserByNameOrAccountId(target);
  if (!targetUser || targetUser.isGuest) {
    return res.status(404).json({ error: 'No account with that username or ID.' });
  }
  if (targetUser.username === me) {
    return res.status(400).json({ error: "You can't add yourself." });
  }
  if (db.anyBlockBetween(me, targetUser.username)) {
    return res.status(403).json({ error: 'This request cannot be sent.' });
  }

  // Use the resolved, correctly-cased username for the duplicate check --
  // matching on the raw (possibly differently-cased) typed input let
  // duplicate requests slip through when case didn't match exactly.
  const existing = db.getFriendRequestBetween(me, targetUser.username);
  if (existing && existing.status === 'accepted') {
    return res.status(409).json({ error: 'You are already friends.' });
  }
  if (existing && existing.status === 'pending') {
    return res.status(409).json({ error: 'A request between you two is already pending.' });
  }

  const request = db.createFriendRequest(me, targetUser.username);

  const io = req.app.get('io');
  io.to(`user:${targetUser.id}`).emit('friend:request', request);

  res.status(201).json({ ok: true, request });
});

router.post('/accept', (req, res) => {
  const { requestId } = req.body || {};
  const request = db.getFriendRequestById(Number(requestId));

  if (!request || request.to !== req.user.username || request.status !== 'pending') {
    return res.status(404).json({ error: 'Request not found.' });
  }

  db.setFriendRequestStatus(request.id, 'accepted');

  const io = req.app.get('io');
  const fromUser = db.getUserByName(request.from);
  if (fromUser) io.to(`user:${fromUser.id}`).emit('friend:accepted', { username: req.user.username });

  res.json({ ok: true });
});

router.post('/decline', (req, res) => {
  const { requestId } = req.body || {};
  const request = db.getFriendRequestById(Number(requestId));

  if (!request || request.to !== req.user.username || request.status !== 'pending') {
    return res.status(404).json({ error: 'Request not found.' });
  }

  db.setFriendRequestStatus(request.id, 'declined');
  res.json({ ok: true });
});

router.post('/remove', (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: 'Missing username.' });
  db.removeFriendship(req.user.username, username);
  res.json({ ok: true });
});

// ---------- Blocking (Privacy) ----------

router.get('/blocked', (req, res) => {
  res.json({ blocked: db.getBlockedList(req.user.username) });
});

router.post('/block', (req, res) => {
  const target = (req.body && req.body.username ? req.body.username : '').trim().replace(/^@/, '');
  if (!target) {
    return res.status(400).json({ error: 'Enter a valid username or account ID to block.' });
  }
  const targetUser = db.getUserByNameOrAccountId(target);
  if (!targetUser) {
    return res.status(404).json({ error: 'No account with that username or ID.' });
  }
  if (targetUser.username === req.user.username) {
    return res.status(400).json({ error: "You can't block yourself." });
  }
  // Blocking also ends any existing friendship and pending requests, so a
  // blocked person can't keep messaging through an old connection.
  db.removeFriendship(req.user.username, targetUser.username);
  res.json(db.blockUser(req.user.username, targetUser.username));
});

router.post('/unblock', (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: 'Missing username.' });
  res.json(db.unblockUser(req.user.username, username));
});

module.exports = router;
