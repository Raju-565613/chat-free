// Pure-JavaScript persistence layer -- a JSON file on disk instead of a
// compiled SQLite binding. This avoids needing Visual Studio / build tools
// on Windows, at the cost of being fine for small/medium chat volumes only.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'data.json');

// 9-character, zero-padded, lowercase hex ID -- e.g. 1 -> "000000001",
// 2 -> "000000002", 16 -> "00000000a". Assigned once per account, in the
// order accounts are created (signup order), and never reused.
function formatAccountId(n) {
  return n.toString(16).padStart(9, '0');
}

const EDIT_WINDOW_MS = 60 * 1000; // 1 minute, for message edit/delete
function withinEditWindow(createdAt) {
  return Date.now() - new Date(createdAt).getTime() <= EDIT_WINDOW_MS;
}

function emptyData() {
  return {
    users: [],
    rooms: [],
    messages: [],
    reports: [],
    friendRequests: [], // { id, from, to, status: pending|accepted|declined, created_at }
    starredFriends: [], // { owner, target } -- owner has starred target as a close friend
    blockedUsers: [], // { owner, target } -- owner has blocked target
    directMessages: [], // { id, from, to, content, file_path, file_name, created_at }
    channels: [], // { id, name, ownerUsername, inviteCode, created_at }
    channelMembers: [], // { channelId, username, role: owner|member, status: approved|pending, created_at }
    channelMessages: [], // { id, channelId, username, content, file_path, file_name, created_at }
    nextUserId: 1,
    nextAccountNumber: 1, // drives the 9-digit hex account ID, in signup order
    nextMessageId: 1,
    nextReportId: 1,
    nextFriendRequestId: 1,
    nextDmId: 1,
    nextChannelId: 1,
    nextChannelMessageId: 1,
  };
}

function load() {
  if (!fs.existsSync(DB_PATH)) return emptyData();
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    // Backfill fields for databases created before a given feature existed.
    const fresh = emptyData();
    Object.keys(fresh).forEach((key) => {
      if (parsed[key] === undefined) parsed[key] = fresh[key];
    });
    parsed.users.forEach((u) => {
      if (u.displayName === undefined) u.displayName = u.username;
      if (u.email === undefined) u.email = null;
      if (u.emailPublic === undefined) u.emailPublic = false;
      if (u.avatarImage === undefined) u.avatarImage = null;
    });
    // Backfill accountId for accounts created before this feature existed.
    // parsed.users is already in creation order (push order), so walking it
    // in order and assigning the next free number preserves signup order.
    parsed.users.forEach((u) => {
      if (!u.accountId) {
        u.accountId = formatAccountId(parsed.nextAccountNumber);
        parsed.nextAccountNumber += 1;
      }
    });
    (parsed.channels || []).forEach((c) => {
      if (c.description === undefined) c.description = '';
      if (c.photo === undefined) c.photo = null;
    });
    return parsed;
  } catch (err) {
    console.error('data.json was unreadable, starting fresh:', err.message);
    return emptyData();
  }
}

let data = load();

function save() {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  // ================= users =================
  getUserByName(username) {
    return data.users.find((u) => u.username.toLowerCase() === String(username).toLowerCase()) || null;
  },
  getUserByAccountId(accountId) {
    return data.users.find((u) => u.accountId === String(accountId).toLowerCase()) || null;
  },
  // Accepts either a username or a 9-character hex account ID and resolves
  // to the matching user, so every "who is this" input in the app can take
  // either form interchangeably.
  getUserByNameOrAccountId(input) {
    const value = String(input || '').trim();
    if (/^[0-9a-f]{9}$/i.test(value)) {
      const byId = this.getUserByAccountId(value);
      if (byId) return byId;
    }
    return this.getUserByName(value);
  },
  getUserById(id) {
    return data.users.find((u) => u.id === id) || null;
  },

  // Renames a username everywhere it's referenced. Usernames are stored as
  // plain strings (not just via the numeric user id) in messages, DMs,
  // friend/star/block relationships, and channel membership/ownership, so
  // all of those need updating together for a rename to be consistent.
  renameUsername(oldUsername, newUsername) {
    const user = this.getUserByName(oldUsername);
    if (!user) return null;
    user.username = newUsername;

    data.messages.forEach((m) => { if (m.username === oldUsername) m.username = newUsername; });
    data.channelMessages.forEach((m) => { if (m.username === oldUsername) m.username = newUsername; });
    data.directMessages.forEach((m) => {
      if (m.from === oldUsername) m.from = newUsername;
      if (m.to === oldUsername) m.to = newUsername;
    });
    data.friendRequests.forEach((r) => {
      if (r.from === oldUsername) r.from = newUsername;
      if (r.to === oldUsername) r.to = newUsername;
    });
    data.starredFriends.forEach((s) => {
      if (s.owner === oldUsername) s.owner = newUsername;
      if (s.target === oldUsername) s.target = newUsername;
    });
    data.blockedUsers.forEach((b) => {
      if (b.owner === oldUsername) b.owner = newUsername;
      if (b.target === oldUsername) b.target = newUsername;
    });
    data.reports.forEach((r) => {
      if (r.reported_username === oldUsername) r.reported_username = newUsername;
      if (r.reporter_username === oldUsername) r.reporter_username = newUsername;
    });
    data.channels.forEach((c) => { if (c.ownerUsername === oldUsername) c.ownerUsername = newUsername; });
    data.channelMembers.forEach((m) => { if (m.username === oldUsername) m.username = newUsername; });

    save();
    return user;
  },
  getUserByGoogleId(googleId) {
    return data.users.find((u) => u.googleId === googleId) || null;
  },
  createUser(username, passwordHash) {
    const user = {
      id: data.nextUserId++,
      accountId: formatAccountId(data.nextAccountNumber++),
      username,
      displayName: username,
      password_hash: passwordHash,
      isGuest: false,
      googleId: null,
      bio: '',
      email: null,
      emailPublic: false,
      avatarColor: randomAvatarColor(),
      avatarImage: null,
      created_at: new Date().toISOString(),
    };
    data.users.push(user);
    save();
    return user;
  },
  // Called on first-ever Google sign-in for this Google account. `username`
  // should already be checked for uniqueness by the caller.
  createGoogleUser(googleId, username, email) {
    const user = {
      id: data.nextUserId++,
      accountId: formatAccountId(data.nextAccountNumber++),
      username,
      displayName: username,
      password_hash: null,
      isGuest: false,
      googleId,
      bio: '',
      email: email || null,
      emailPublic: false,
      avatarColor: randomAvatarColor(),
      avatarImage: null,
      created_at: new Date().toISOString(),
    };
    data.users.push(user);
    save();
    return user;
  },
  createGuestUser() {
    const suffix = crypto.randomBytes(3).toString('hex');
    const username = `Guest-${suffix}`;
    const user = {
      id: data.nextUserId++,
      accountId: formatAccountId(data.nextAccountNumber++),
      username,
      password_hash: null,
      isGuest: true,
      bio: '',
      avatarColor: randomAvatarColor(),
      created_at: new Date().toISOString(),
    };
    data.users.push(user);
    save();
    return user;
  },
  updateProfile(userId, { bio, avatarColor, displayName, email, emailPublic, avatarImage }) {
    const user = data.users.find((u) => u.id === userId);
    if (!user) return null;
    if (typeof bio === 'string') user.bio = bio.slice(0, 200);
    if (typeof avatarColor === 'string') user.avatarColor = avatarColor;
    if (typeof displayName === 'string' && displayName.trim()) {
      user.displayName = displayName.trim().slice(0, 40);
    }
    if (typeof email === 'string') user.email = email.trim().slice(0, 120) || null;
    if (typeof emailPublic === 'boolean') user.emailPublic = emailPublic;
    if (typeof avatarImage === 'string') user.avatarImage = avatarImage;
    save();
    return user;
  },
  getPublicProfile(identifier) {
    const user = this.getUserByNameOrAccountId(identifier);
    if (!user) return null;
    return {
      username: user.username,
      accountId: user.accountId,
      displayName: user.displayName || user.username,
      bio: user.bio || '',
      avatarColor: user.avatarColor,
      avatarImage: user.avatarImage || null,
      email: user.emailPublic ? user.email || null : null,
    };
  },
  updatePassword(userId, passwordHash) {
    const user = data.users.find((u) => u.id === userId);
    if (!user) return null;
    user.password_hash = passwordHash;
    save();
    return user;
  },

  // ================= rooms (NetChat, network-detected) =================
  getRoom(id) {
    return data.rooms.find((r) => r.id === id) || null;
  },
  createRoom(id, label, kind) {
    const room = { id, label, kind, created_at: new Date().toISOString() };
    data.rooms.push(room);
    save();
    return room;
  },

  // ================= messages (NetChat) =================
  getDisplayName(username) {
    const u = this.getUserByName(username);
    return u ? u.displayName || u.username : username;
  },
  getMessagesByRoom(roomId, limit = 200) {
    return data.messages.filter((m) => m.room_id === roomId).slice(-limit);
  },
  getMessageById(id) {
    return data.messages.find((m) => m.id === id) || null;
  },

  // ---------- Message edit / delete (1-minute window, own messages only) ----------
  // Shared logic across the three message stores (room, channel, DM) --
  // they differ only in which array to search and which field names the
  // owner/sender.
  _editMessage(list, id, ownerField, username, content) {
    const m = list.find((x) => x.id === id);
    if (!m) return { error: 'not_found' };
    if (m[ownerField] !== username) return { error: 'forbidden' };
    if (m.deleted) return { error: 'deleted' };
    if (!withinEditWindow(m.created_at)) return { error: 'expired' };
    if (m.file_path) return { error: 'not_text' }; // file/image messages aren't editable, only deletable
    m.content = content;
    m.edited = true;
    save();
    return { message: m };
  },
  _deleteMessage(list, id, ownerField, username) {
    const m = list.find((x) => x.id === id);
    if (!m) return { error: 'not_found' };
    if (m[ownerField] !== username) return { error: 'forbidden' };
    if (m.deleted) return { error: 'deleted' };
    if (!withinEditWindow(m.created_at)) return { error: 'expired' };
    m.deleted = true;
    m.content = null;
    m.file_path = null;
    m.file_name = null;
    save();
    return { message: m };
  },
  editRoomMessage(id, username, content) {
    return this._editMessage(data.messages, id, 'username', username, content);
  },
  deleteRoomMessage(id, username) {
    return this._deleteMessage(data.messages, id, 'username', username);
  },
  editChannelMessage(id, username, content) {
    return this._editMessage(data.channelMessages, id, 'username', username, content);
  },
  deleteChannelMessage(id, username) {
    return this._deleteMessage(data.channelMessages, id, 'username', username);
  },
  editDirectMessage(id, username, content) {
    return this._editMessage(data.directMessages, id, 'from', username, content);
  },
  deleteDirectMessage(id, username) {
    return this._deleteMessage(data.directMessages, id, 'from', username);
  },
  createMessage({ room_id, user_id, username, content = null, file_path = null, file_name = null }) {
    const message = {
      id: data.nextMessageId++,
      room_id,
      user_id,
      username,
      content,
      file_path,
      file_name,
      created_at: new Date().toISOString(),
    };
    data.messages.push(message);
    save();
    return message;
  },

  // ================= reports (flagging bad-actor messages/users) =================
  createReport({ room_id, message_id, reported_username, reporter_username, reason, details }) {
    const report = {
      id: data.nextReportId++,
      room_id,
      message_id: message_id || null,
      reported_username,
      reporter_username,
      reason,
      details: details || null,
      created_at: new Date().toISOString(),
    };
    data.reports.push(report);
    save();
    return report;
  },
  getReportsByRoom(roomId, limit = 50) {
    return data.reports
      .filter((r) => r.room_id === roomId)
      .slice(-limit)
      .reverse();
  },
  countReportsAgainst(roomId, username) {
    return data.reports.filter((r) => r.room_id === roomId && r.reported_username === username).length;
  },
  countMessages(roomId) {
    return data.messages.filter((m) => m.room_id === roomId && !m.file_path).length;
  },
  countFiles(roomId) {
    return data.messages.filter((m) => m.room_id === roomId && m.file_path).length;
  },
  countActiveUsers(roomId) {
    return new Set(data.messages.filter((m) => m.room_id === roomId).map((m) => m.username)).size;
  },
  firstActivity(roomId, fallback) {
    const msgs = data.messages.filter((m) => m.room_id === roomId);
    return msgs.length ? msgs[0].created_at : fallback;
  },

  // ================= friends =================
  getFriendRequestBetween(userA, userB) {
    return (
      data.friendRequests.find(
        (r) =>
          ((r.from === userA && r.to === userB) || (r.from === userB && r.to === userA)) &&
          r.status !== 'declined'
      ) || null
    );
  },
  createFriendRequest(from, to) {
    const req = {
      id: data.nextFriendRequestId++,
      from,
      to,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    data.friendRequests.push(req);
    save();
    return req;
  },
  getFriendRequestById(id) {
    return data.friendRequests.find((r) => r.id === id) || null;
  },
  setFriendRequestStatus(id, status) {
    const req = data.friendRequests.find((r) => r.id === id);
    if (!req) return null;
    req.status = status;
    save();
    return req;
  },
  removeFriendship(userA, userB) {
    data.friendRequests = data.friendRequests.filter(
      (r) => !((r.from === userA && r.to === userB) || (r.from === userB && r.to === userA))
    );
    data.starredFriends = data.starredFriends.filter(
      (s) => !((s.owner === userA && s.target === userB) || (s.owner === userB && s.target === userA))
    );
    save();
  },
  toggleStarredFriend(owner, target) {
    const existing = data.starredFriends.find((s) => s.owner === owner && s.target === target);
    if (existing) {
      data.starredFriends = data.starredFriends.filter((s) => s !== existing);
      save();
      return { starred: false };
    }
    data.starredFriends.push({ owner, target });
    save();
    return { starred: true };
  },
  getStarredSet(owner) {
    return new Set(data.starredFriends.filter((s) => s.owner === owner).map((s) => s.target));
  },

  // ---------- Blocking ----------
  blockUser(owner, target) {
    if (!data.blockedUsers.some((b) => b.owner === owner && b.target === target)) {
      data.blockedUsers.push({ owner, target });
      save();
    }
    return { blocked: true };
  },
  unblockUser(owner, target) {
    data.blockedUsers = data.blockedUsers.filter((b) => !(b.owner === owner && b.target === target));
    save();
    return { blocked: false };
  },
  isBlocked(owner, target) {
    return data.blockedUsers.some((b) => b.owner === owner && b.target === target);
  },
  // True if either side has blocked the other -- used to gate DMs/requests.
  anyBlockBetween(userA, userB) {
    return data.blockedUsers.some(
      (b) => (b.owner === userA && b.target === userB) || (b.owner === userB && b.target === userA)
    );
  },
  getBlockedList(owner) {
    return data.blockedUsers.filter((b) => b.owner === owner).map((b) => b.target);
  },
  areFriends(userA, userB) {
    return data.friendRequests.some(
      (r) =>
        r.status === 'accepted' &&
        ((r.from === userA && r.to === userB) || (r.from === userB && r.to === userA))
    );
  },
  listFriends(username) {
    return data.friendRequests
      .filter((r) => r.status === 'accepted' && (r.from === username || r.to === username))
      .map((r) => (r.from === username ? r.to : r.from));
  },
  listIncomingRequests(username) {
    return data.friendRequests.filter((r) => r.to === username && r.status === 'pending');
  },
  listOutgoingRequests(username) {
    return data.friendRequests.filter((r) => r.from === username && r.status === 'pending');
  },

  // ================= direct messages =================
  createDirectMessage({ from, to, content = null, file_path = null, file_name = null }) {
    const dm = {
      id: data.nextDmId++,
      from,
      to,
      content,
      file_path,
      file_name,
      created_at: new Date().toISOString(),
    };
    data.directMessages.push(dm);
    save();
    return dm;
  },
  getDirectMessages(userA, userB, limit = 200) {
    return data.directMessages
      .filter(
        (m) => (m.from === userA && m.to === userB) || (m.from === userB && m.to === userA)
      )
      .slice(-limit);
  },

  // ================= OutChat channels =================
  createChannel(name, ownerUsername) {
    const channel = {
      id: `ch_${data.nextChannelId++}`,
      name: name.slice(0, 60),
      description: '',
      photo: null,
      ownerUsername,
      inviteCode: crypto.randomBytes(4).toString('hex'),
      created_at: new Date().toISOString(),
    };
    data.channels.push(channel);
    data.channelMembers.push({
      channelId: channel.id,
      username: ownerUsername,
      role: 'owner',
      status: 'approved',
      created_at: new Date().toISOString(),
    });
    save();
    return channel;
  },
  updateChannelProfile(channelId, { name, description, photo }) {
    const channel = data.channels.find((c) => c.id === channelId);
    if (!channel) return null;
    if (name !== undefined) channel.name = name.slice(0, 60);
    if (description !== undefined) channel.description = description.slice(0, 200);
    if (photo !== undefined) channel.photo = photo;
    save();
    return channel;
  },
  getChannelById(id) {
    return data.channels.find((c) => c.id === id) || null;
  },
  getChannelByInvite(code) {
    return data.channels.find((c) => c.inviteCode === code) || null;
  },
  regenerateInvite(channelId) {
    const channel = data.channels.find((c) => c.id === channelId);
    if (!channel) return null;
    channel.inviteCode = crypto.randomBytes(4).toString('hex');
    save();
    return channel;
  },
  listChannelsForUser(username) {
    const memberships = data.channelMembers.filter(
      (m) => m.username === username && m.status === 'approved'
    );
    return memberships
      .map((m) => {
        const channel = data.channels.find((c) => c.id === m.channelId);
        return channel ? { ...channel, myRole: m.role } : null;
      })
      .filter(Boolean);
  },
  getMembership(channelId, username) {
    return (
      data.channelMembers.find((m) => m.channelId === channelId && m.username === username) ||
      null
    );
  },
  addMembership(channelId, username, role, status) {
    const existing = this.getMembership(channelId, username);
    if (existing) {
      existing.status = status;
      existing.role = role;
      save();
      return existing;
    }
    const membership = { channelId, username, role, status, created_at: new Date().toISOString() };
    data.channelMembers.push(membership);
    save();
    return membership;
  },
  removeMembership(channelId, username) {
    data.channelMembers = data.channelMembers.filter(
      (m) => !(m.channelId === channelId && m.username === username)
    );
    save();
  },
  listApprovedMembers(channelId) {
    return data.channelMembers.filter((m) => m.channelId === channelId && m.status === 'approved');
  },
  listPendingMembers(channelId) {
    return data.channelMembers.filter((m) => m.channelId === channelId && m.status === 'pending');
  },
  transferOwnership(channelId, fromUsername, toUsername) {
    const channel = data.channels.find((c) => c.id === channelId);
    const oldOwner = this.getMembership(channelId, fromUsername);
    const newOwner = this.getMembership(channelId, toUsername);
    if (!channel || !oldOwner || !newOwner) return null;
    channel.ownerUsername = toUsername;
    oldOwner.role = 'member';
    newOwner.role = 'owner';
    save();
    return channel;
  },
  deleteChannel(channelId) {
    data.channels = data.channels.filter((c) => c.id !== channelId);
    data.channelMembers = data.channelMembers.filter((m) => m.channelId !== channelId);
    data.channelMessages = data.channelMessages.filter((m) => m.channelId !== channelId);
    save();
  },

  // ================= OutChat channel messages =================
  createChannelMessage({ channelId, username, content = null, file_path = null, file_name = null }) {
    const message = {
      id: data.nextChannelMessageId++,
      channelId,
      username,
      content,
      file_path,
      file_name,
      created_at: new Date().toISOString(),
    };
    data.channelMessages.push(message);
    save();
    return message;
  },
  getChannelMessages(channelId, limit = 200) {
    return data.channelMessages.filter((m) => m.channelId === channelId).slice(-limit);
  },
};

function randomAvatarColor() {
  const palette = ['#39ff6e', '#f2c14e', '#5eead4', '#f2716b', '#7dd3fc', '#c084fc', '#fb923c'];
  return palette[Math.floor(Math.random() * palette.length)];
}
