const crypto = require('crypto');
const db = require('./db');

const OVERRIDE_COOKIE = 'nc_room_override';

/**
 * Turns a raw IP address into a short, stable, non-reversible room code.
 * Same network -> same public IP -> same hash -> same room, every time.
 */
function hashIp(ip) {
  const clean = normalizeIp(ip);
  return crypto.createHash('sha256').update(clean).digest('hex').slice(0, 10);
}

// Strips IPv6-mapped-IPv4 prefixes etc. so localhost testing behaves sanely.
function normalizeIp(ip) {
  if (!ip) return 'unknown';
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
}

// Custom room names are free text -> slugify + hash so storage stays clean
// and collisions from formatting differences ("My Room" vs "my-room") merge.
function slugifyRoomName(name) {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'room';
}
function customRoomId(name) {
  const slug = slugifyRoomName(name);
  const hash = crypto.createHash('sha256').update(slug).digest('hex').slice(0, 6);
  return `c-${slug}-${hash}`;
}

function ensureRoom(id, label, kind) {
  const existing = db.getRoom(id);
  if (existing) return existing;
  return db.createRoom(id, label, kind);
}

/**
 * Resolves which room a request belongs to.
 * Priority: manual override (cookie or explicit param) > auto IP-hash.
 */
function resolveRoom(req) {
  const overrideName = req.cookies && req.cookies[OVERRIDE_COOKIE];

  if (overrideName) {
    const id = customRoomId(overrideName);
    const room = ensureRoom(id, overrideName.trim(), 'manual');
    return room;
  }

  const ip = getClientIp(req);
  const id = hashIp(ip);
  const room = ensureRoom(id, `Network ${id}`, 'auto');
  return room;
}

function getClientIp(req) {
  // req.ip already respects `app.set('trust proxy', ...)` when enabled.
  return req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
}

module.exports = {
  OVERRIDE_COOKIE,
  hashIp,
  slugifyRoomName,
  customRoomId,
  ensureRoom,
  resolveRoom,
  getClientIp,
};
