const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/me', requireAuth, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({
    username: user.username,
    accountId: user.accountId,
    displayName: user.displayName || user.username,
    isGuest: !!user.isGuest,
    hasPassword: !!user.password_hash,
    bio: user.bio || '',
    email: user.email || '',
    emailPublic: !!user.emailPublic,
    avatarColor: user.avatarColor,
    avatarImage: user.avatarImage || null,
    createdAt: user.created_at,
  });
});

router.patch('/me', requireAuth, (req, res) => {
  const { bio, avatarColor, displayName, email, emailPublic } = req.body || {};

  if (displayName !== undefined && (!displayName.trim() || displayName.trim().length > 40)) {
    return res.status(400).json({ error: 'Display name must be 1-40 characters.' });
  }

  const user = db.updateProfile(req.user.id, { bio, avatarColor, displayName, email, emailPublic });
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({
    displayName: user.displayName || user.username,
    bio: user.bio,
    avatarColor: user.avatarColor,
    email: user.email || '',
    emailPublic: !!user.emailPublic,
  });
});

router.post('/change-password', requireAuth, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user || user.isGuest || !user.password_hash) {
    return res.status(403).json({ error: "This account doesn't have a password to change (guest or Google sign-in)." });
  }

  const { currentPassword, newPassword } = req.body || {};
  if (!bcrypt.compareSync(currentPassword || '', user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password needs 6+ characters.' });
  }

  db.updatePassword(user.id, bcrypt.hashSync(newPassword, 10));
  res.json({ ok: true });
});

router.post('/username', requireAuth, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (user.isGuest) return res.status(403).json({ error: "Guests can't change their username." });

  const { newUsername, currentPassword } = req.body || {};
  const clean = (newUsername || '').trim();

  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(clean)) {
    return res.status(400).json({
      error: 'Username must be 3-20 characters: letters, numbers, underscores, or hyphens only.',
    });
  }
  if (clean.toLowerCase() === user.username.toLowerCase()) {
    return res.status(400).json({ error: 'That\'s already your username.' });
  }
  if (db.getUserByName(clean)) {
    return res.status(409).json({ error: 'That username is taken.' });
  }
  // Password-holding accounts must confirm with their password, since a
  // username is also the login handle -- this prevents someone with a
  // hijacked session from silently taking over the account identity.
  if (user.password_hash && !bcrypt.compareSync(currentPassword || '', user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  const oldUsername = user.username;
  db.renameUsername(oldUsername, clean);

  // The old JWT has the old username baked in and is used for socket auth
  // and various username-based checks, so issue a fresh one immediately.
  const token = jwt.sign(
    { id: user.id, username: clean, isGuest: false },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({ ok: true, username: clean, token });
});

// ---------- Custom-image avatar upload ----------

const avatarRoot = path.join(__dirname, '..', '..', 'uploads', 'avatars');
fs.mkdirSync(avatarRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarRoot),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, '') || '.jpg';
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB cap -- these are just avatars
  fileFilter: (req, file, cb) => {
    if (!/^image\/(png|jpe?g|gif|webp)$/.test(file.mimetype)) {
      return cb(new Error('Please upload a PNG, JPG, GIF, or WEBP image.'));
    }
    cb(null, true);
  },
});

router.post('/avatar', requireAuth, (req, res) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No image received.' });

    const relPath = `/uploads/avatars/${req.file.filename}`;
    const user = db.updateProfile(req.user.id, { avatarImage: relPath });
    res.status(201).json({ avatarImage: user.avatarImage });
  });
});

// ---------- Public profile card (click a username anywhere to view) ----------

router.get('/public/:username', requireAuth, (req, res) => {
  const profile = db.getPublicProfile(req.params.username);
  if (!profile) return res.status(404).json({ error: 'User not found.' });
  res.json(profile);
});

module.exports = router;
