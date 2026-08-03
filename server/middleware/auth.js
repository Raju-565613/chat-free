const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Log in to continue.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, username, isGuest }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Your session expired. Log in again.' });
  }
}

// OutChat and Friends require a real account -- guests are NetChat-only.
function requireNonGuest(req, res, next) {
  if (req.user && req.user.isGuest) {
    return res.status(403).json({ error: 'Guests can\'t use this feature. Sign up for a full account to unlock it.' });
  }
  next();
}

module.exports = { requireAuth, requireNonGuest };
