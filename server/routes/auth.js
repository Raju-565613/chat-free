const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../db');

const router = express.Router();
const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

function sign(user) {
  return jwt.sign(
    { id: user.id, username: user.username, isGuest: !!user.isGuest },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function authResponse(user) {
  return {
    token: sign(user),
    username: user.username,
    accountId: user.accountId,
    isGuest: !!user.isGuest,
    bio: user.bio || '',
    displayName: user.displayName || user.username,
    avatarColor: user.avatarColor,
    avatarImage: user.avatarImage || null,
  };
}

router.post('/signup', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password || username.trim().length < 3 || password.length < 6) {
    return res.status(400).json({
      error: 'Username needs 3+ characters and password needs 6+ characters.',
    });
  }

  const clean = username.trim();
  if (db.getUserByName(clean)) {
    return res.status(409).json({ error: 'That username is taken.' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const user = db.createUser(clean, hash);

  res.status(201).json(authResponse(user));
});

// Per-account lockout, on top of the IP-based rate limit above -- this
// specifically stops repeated password guesses against one account from
// behind a shared/rotating IP. In-memory by design (resets on restart);
// that's an acceptable tradeoff for an app this size rather than adding
// persistent storage complexity for it.
const failedLogins = new Map(); // username -> { count, lockedUntil }
const MAX_ATTEMPTS = 6;
const LOCKOUT_MS = 5 * 60 * 1000;

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const key = (username || '').trim().toLowerCase();
  const record = failedLogins.get(key);

  if (record && record.lockedUntil && record.lockedUntil > Date.now()) {
    const waitMin = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return res.status(429).json({ error: `Too many failed attempts. Try again in ${waitMin} minute(s).` });
  }

  const user = username && db.getUserByName(username.trim());
  const ok = user && !user.isGuest && user.password_hash && bcrypt.compareSync(password || '', user.password_hash);

  if (!ok) {
    const count = (record?.count || 0) + 1;
    failedLogins.set(key, {
      count,
      lockedUntil: count >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : null,
    });
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }

  failedLogins.delete(key);
  res.json(authResponse(user));
});

// Guests get instant access to NetChat only -- no password, no friends/OutChat.
router.post('/guest', (req, res) => {
  const user = db.createGuestUser();
  res.status(201).json(authResponse(user));
});

// The frontend calls this to decide whether to render the Google button at
// all -- if no Client ID is configured, Google Sign-In is silently hidden
// rather than shown as a broken/erroring option.
router.get('/google-client-id', (req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID || null });
});

router.post('/google', async (req, res) => {
  if (!googleClient) {
    return res.status(503).json({ error: 'Google Sign-In is not configured on this server.' });
  }
  const { credential } = req.body || {};
  if (!credential) return res.status(400).json({ error: 'Missing Google credential.' });

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    return res.status(401).json({ error: 'Could not verify Google sign-in. Please try again.' });
  }

  const googleId = payload.sub;
  let user = db.getUserByGoogleId(googleId);

  if (!user) {
    // First time this Google account has signed in here -- create a local
    // account for it. Prefer the email's local-part as the username, falling
    // back to a short google-id-based one if it's taken or unavailable.
    const base = (payload.email ? payload.email.split('@')[0] : `google-${googleId.slice(0, 8)}`)
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 20) || `google-${googleId.slice(0, 8)}`;

    let candidate = base;
    let suffix = 1;
    while (db.getUserByName(candidate)) {
      candidate = `${base}${suffix}`;
      suffix += 1;
    }

    user = db.createGoogleUser(googleId, candidate);
  }

  res.json(authResponse(user));
});

module.exports = router;
