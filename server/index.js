require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const profileRoutes = require('./routes/profile');
const friendsRoutes = require('./routes/friends');
const dmRoutes = require('./routes/dm');
const outchatRoutes = require('./routes/outchat');
const { initSocket } = require('./socket');

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET. Copy .env.example to .env and set one before starting.');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.set('io', io);

// When deployed behind a reverse proxy (Render, Railway, Nginx, Cloudflare
// Tunnel), this makes req.ip reflect the real visitor IP instead of the
// proxy's IP -- which is what room auto-detection AND rate limiting depend on.
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', true);
}

// ---------- Security hardening ----------
// This is application-layer hardening, not a network firewall -- a real
// firewall is infrastructure (your router, cloud provider's security group,
// or a reverse proxy like Cloudflare/Nginx) and sits in front of this app,
// not inside it. What's here reduces the app's own attack surface:
// standard security headers, and rate limits against brute force / abuse.

app.disable('x-powered-by');
app.use(
  helmet({
    // The login screen loads Google's Sign-In script and Google Fonts from
    // their CDNs, so a strict default-src CSP would need careful per-deploy
    // tuning. Left off by default; see README's "Preparing for a public
    // web release" section for a starting CSP if you want to lock this down
    // further once you know your exact deployment domain.
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Reflects the request's origin by default (fine for LAN use, where the
// "origin" is whatever IP:port someone typed in). For a public deployment,
// set ALLOWED_ORIGIN in .env to your real domain to stop other websites
// from making authenticated requests against your API in a visitor's browser.
const allowedOrigin = process.env.ALLOWED_ORIGIN || true;
app.use(cors({ origin: allowedOrigin, credentials: true }));

// General API rate limit -- generous enough for normal chatting, but caps
// scripted abuse/scraping.
app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please slow down and try again shortly.' },
  })
);

// Tighter limit specifically on auth endpoints -- the main brute-force
// target (password guessing against login, spam account creation).
app.use(
  ['/api/auth/login', '/api/auth/signup', '/api/auth/guest'],
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts from this network. Please wait a few minutes.' },
  })
);

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/outchat', outchatRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

initSocket(io);

const PORT = process.env.PORT || 3000;
// Binding to 0.0.0.0 (not "localhost") is what makes the app reachable from
// other devices on the network, not just this machine.
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Chat Free running on:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://<this-machine's-LAN-IP>:${PORT}`);
});
