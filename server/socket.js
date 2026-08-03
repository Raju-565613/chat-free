const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const db = require('../server/db');
const { resolveRoom } = require('./rooms');

function roomMemberCount(io, roomId) {
  const room = io.sockets.adapter.rooms.get(roomId);
  return room ? room.size : 0;
}

function initSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error('unauthorized'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (err) {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    // A per-user room, independent of NetChat's network-room -- this is how
    // DMs and OutChat notifications (friend requests, approvals, kicks)
    // reach a specific person regardless of which app mode they're viewing.
    socket.join(`user:${socket.user.id}`);

    // ---------------- NetChat (network-detected room) ----------------

    // Reconstruct a minimal req-like object so resolveRoom() can be reused as-is.
    const rawCookies = socket.handshake.headers.cookie
      ? cookie.parse(socket.handshake.headers.cookie)
      : {};
    const fakeReq = {
      cookies: rawCookies,
      ip: socket.handshake.address,
      headers: socket.handshake.headers,
    };

    const room = resolveRoom(fakeReq);
    socket.join(room.id);
    socket.roomId = room.id;

    io.to(room.id).emit('presence:count', roomMemberCount(io, room.id));
    socket.emit('room:joined', room);

    socket.on('chat:message', (payload) => {
      const content = (payload && payload.content ? String(payload.content) : '').trim();
      if (!content || content.length > 4000) return;

      const message = db.createMessage({
        room_id: room.id,
        user_id: socket.user.id,
        username: socket.user.username,
        content,
      });

      io.to(room.id).emit('chat:message', { ...message, displayName: db.getDisplayName(message.username) });
    });

    socket.on('disconnect', () => {
      // slight delay so the leaving socket is excluded from the recount
      setTimeout(() => io.to(room.id).emit('presence:count', roomMemberCount(io, room.id)), 50);
    });

    // ---------------- Friends: direct messages ----------------

    socket.on('dm:message', (payload, ack) => {
      if (socket.user.isGuest) return ack && ack({ error: 'Guests cannot use direct messages.' });

      const to = payload && payload.to;
      const content = (payload && payload.content ? String(payload.content) : '').trim();
      if (!to || !content || content.length > 4000) return ack && ack({ error: 'Invalid message.' });
      if (!db.areFriends(socket.user.username, to)) {
        return ack && ack({ error: 'You can only message friends.' });
      }

      const message = db.createDirectMessage({ from: socket.user.username, to, content });
      const targetUser = db.getUserByName(to);
      const outgoing = { ...message, displayName: db.getDisplayName(message.from) };

      socket.emit('dm:message', outgoing);
      if (targetUser) io.to(`user:${targetUser.id}`).emit('dm:message', outgoing);
      ack && ack({ ok: true });
    });

    // ---------------- OutChat: user-created channels ----------------

    socket.on('outchat:join', (payload, ack) => {
      if (socket.user.isGuest) return ack && ack({ error: 'Guests cannot use OutChat.' });

      const channelId = payload && payload.channelId;
      const membership = channelId && db.getMembership(channelId, socket.user.username);
      if (!membership || membership.status !== 'approved') {
        return ack && ack({ error: 'You are not a member of this channel.' });
      }

      socket.join(`outchat:${channelId}`);
      ack && ack({ ok: true });
    });

    socket.on('outchat:leave', (payload) => {
      const channelId = payload && payload.channelId;
      if (channelId) socket.leave(`outchat:${channelId}`);
    });

    socket.on('outchat:message', (payload, ack) => {
      if (socket.user.isGuest) return ack && ack({ error: 'Guests cannot use OutChat.' });

      const channelId = payload && payload.channelId;
      const content = (payload && payload.content ? String(payload.content) : '').trim();
      if (!channelId || !content || content.length > 4000) {
        return ack && ack({ error: 'Invalid message.' });
      }

      // Re-check membership server-side rather than trusting the earlier join.
      const membership = db.getMembership(channelId, socket.user.username);
      if (!membership || membership.status !== 'approved') {
        return ack && ack({ error: 'You are not a member of this channel.' });
      }

      const message = db.createChannelMessage({
        channelId,
        username: socket.user.username,
        content,
      });

      io.to(`outchat:${channelId}`).emit('outchat:message', { ...message, displayName: db.getDisplayName(message.username) });
      ack && ack({ ok: true });
    });

    // ---------------- Typing indicators (NetChat / OutChat / DM) ----------------
    // Lightweight, fire-and-forget -- no "stop typing" event needed since the
    // receiver just clears its own indicator after a short timeout of silence.

    socket.on('typing', (payload) => {
      const context = payload && payload.context;
      const displayName = db.getDisplayName(socket.user.username);

      if (context === 'netchat') {
        socket.to(room.id).emit('typing', { context, username: socket.user.username, displayName });
      } else if (context === 'outchat' && payload.channelId) {
        socket.to(`outchat:${payload.channelId}`).emit('typing', {
          context,
          channelId: payload.channelId,
          username: socket.user.username,
          displayName,
        });
      } else if (context === 'dm' && payload.to) {
        const targetUser = db.getUserByName(payload.to);
        if (targetUser) {
          io.to(`user:${targetUser.id}`).emit('typing', {
            context,
            username: socket.user.username,
            displayName,
          });
        }
      }
    });
  });
}

module.exports = { initSocket };
