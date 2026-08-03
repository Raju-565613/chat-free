# Chat Free

Two apps in one, switchable with a single button top-right:

- **NetChat** — the network-detected room system: everyone on the same
  WiFi/Ethernet lands in the same room automatically. Neon-green "hacker"
  theme. Guests can use this without an account.
- **OutChat** — a normal Discord-style chat: create a channel, share its
  invite code, the owner approves join requests, and can kick members or
  transfer ownership. Works over the internet, no shared network required.
  Yellow / navy-blue theme. Requires a full account (not available to guests).

Also included: friends (add by username, accept/decline requests), private
1:1 direct messages, a profile page (bio, avatar color, password change),
and a light/dark toggle for NetChat's theme.

Built with: Node.js, Express, Socket.io, a pure-JS JSON file database, JWT auth.
No native/compiled modules are used, so `npm install` works on Windows without
Visual Studio Build Tools.

---

## 1. Install

```bash
cd network-chat
npm install
cp .env.example .env
```

Open `.env` and set a real `JWT_SECRET`. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**About the "X vulnerabilities" line `npm install` prints:** that's just an
advisory about known issues in some sub-dependencies — it doesn't mean the
install failed (you'll still see "added N packages" right above it, and
`npm start` will work normally). If you want to clear it up, run:
```bash
npm audit fix
```
This only applies non-breaking updates, so it's safe to run anytime.

## 2. Run it

```bash
npm start
```

You'll see:

```
Network Chat running on:
  Local:   http://localhost:3000
  Network: http://<this-machine's-LAN-IP>:3000
```

## 3. Access from other devices on your network

1. On the host machine, find its LAN IP:
   - Windows: `ipconfig` → look for "IPv4 Address"
   - Mac/Linux: `ifconfig` or `ip addr` → look for something like `192.168.x.x`
2. On any other device connected to the **same WiFi or Ethernet**, open a browser and go to:
   ```
   http://<that-ip>:3000
   ```
3. Sign up / log in. Everyone on that network lands in the same auto-detected room.
4. Move to a different network (e.g. your phone switches from home WiFi to mobile data) and reload — you'll be placed in a different room automatically.

**Firewall note:** if other devices can't reach it, allow inbound connections on port 3000 in your OS firewall (Windows Defender Firewall / macOS Firewall / `ufw` on Linux).

**Static IP note:** most routers reassign local IPs over time (DHCP). Reserve a static IP for the host machine in your router's settings so the link doesn't change.

## 4. Manual room override (for mobile data users)

Click the room badge in the top bar → enter a custom room name → **Use this room**.
This is stored as a cookie on that device and overrides IP-based detection until
cleared with **Use auto-detected network**.

## 5. Guests, OutChat, Friends, and DMs

**Guest login** — click "Continue as guest" on the login screen. No password
needed. Guests can only use NetChat; the OutChat button and Friends are
hidden/blocked for them, since there's no persistent account to attach
friend relationships or channel ownership to.

**Switching apps** — once logged in, click the pill button top-right
("OutChat →" / "← NetChat") to switch. Your choice is remembered per device.

**OutChat channels**:
- Click **+ Create channel**, give it a name — you become the owner and get
  a shareable invite code.
- Others enter that code under "Join with code" — this sends a join
  *request*; nothing is auto-approved.
- As owner, click **Manage** on the channel to approve/reject pending
  requests, **kick** existing members, or **transfer ownership** to someone
  else (you'll become a regular member).
- Anyone can **Leave** a channel. If the owner leaves, ownership passes to
  the next-longest member automatically; if they were the last member, the
  channel is deleted.

**Friends** — click the friends icon (top bar, either app) to add someone by
username, and accept/decline incoming requests. Only mutual friends can
direct-message each other.

**Direct messages** — click **Message** next to a friend in the Friends
list to open a private 1:1 chat, delivered in real time over the same
connection as the rest of the app.

## 6. Reporting bad-actor users (NetChat)

Hover any message that isn't your own → click the small ⚑ flag icon that appears
→ choose a reason (harassment, spam, inappropriate content, impersonation,
other) and optional details → **Submit report**.

Click **Insights** in the top bar to see:
- Room stats (message count, files shared, active users)
- **Flagged users** — everyone reported in this room, sorted by report count,
  with their most recent reason. This is visible to everyone in the room
  since there's no separate admin role in this starter — it's a community
  signal, not a silent ban or deletion.

## 7. Light / dark mode

Click the sun/moon icon (top-right of the login screen, or next to Insights
in the chat header) to switch themes. Defaults to dark with a neon-green
"hacker terminal" look; your choice is remembered per-device via localStorage.

## 8. Google Sign-In (optional)

This is off by default — the app works fully without it. To turn it on:

1. Go to https://console.cloud.google.com/apis/credentials, create an **OAuth
   client ID** of type **Web application**.
2. Under **Authorized JavaScript origins**, add the exact URL you'll load the
   app from (e.g. `http://localhost:3000`).
3. Copy the generated Client ID into your `.env` file:
   ```
   GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
   ```
4. Restart the server (`npm start`). A "Sign in with Google" button will now
   appear on the login screen automatically.

First-time Google sign-in creates a local account for that Google identity
(username derived from the email, password-less). Returning Google users are
matched by their Google account ID.

**Important limitation for your LAN use case:** Google does not allow raw IP
addresses (like `http://192.168.1.15:3000`) as an authorized origin — only
real domains, plus `localhost` specifically on the machine running the
browser. This means Google Sign-In will work when you open the app via
`localhost` on the host machine itself, but **won't work for other devices
on your network** accessing it by IP, since Google will reject the origin.
Regular username/password login and guest login are unaffected and work
everywhere as before — Google Sign-In is best treated as a convenience for
whoever's on the host machine, not a requirement for the rest of the network.

## 9. What's new: tutorial, channel photos, safer transfers, more file sharing

**First-time tutorial** — the first time you enter NetChat or OutChat, a short
walkthrough appears. Click through it or hit "I'm not new — skip." Replay it
anytime with the **?** button in either top bar.

**Profile, simplified** — clicking your avatar now shows a clean read-only
summary (name, email, bio, avatar). Click **Settings** from there for
everything editable (avatar upload, display name, password, theme, logout).

**Click outside to close** — any popup (Profile, Friends, DM panel, etc.)
closes when you click the dimmed area around it, not just the × button.

**File & image sharing everywhere** — DMs and OutChat channels can now share
files the same way NetChat already could; images show as inline previews.

**Safer ownership transfer** — the channel's ⋮ menu now holds Edit profile,
Manage, Transfer ownership, and Leave. Transferring ownership takes three
deliberate steps (pick a member → confirm → final check) so it can't happen
by accident. The old one-click "Make owner" button in Manage is gone.

**Custom channel profile** — as owner, use "Edit channel profile" (in the ⋮
menu) to set a channel photo and description, WhatsApp-group style.

**Room Insights** now shows a live "Currently online" count alongside the
all-time stats.

## 10. Account IDs, username changes, and message edit/delete

**Account ID** — every account gets a permanent 9-character hex ID (`000000001`,
`000000002`, ...) in signup order, shown on your Profile page. Anywhere you'd
type a username (adding a friend, blocking someone), you can type their
account ID instead — both work interchangeably.

**Changing your username** — Settings → Username → Change. Requires your
password (if you have one) to confirm, since your username is also your
login handle. This renames you consistently everywhere: past messages,
friends, DMs, channel ownership — nothing breaks or orphans.

**Editing / deleting messages** — you have **1 minute** after sending a
message (in NetChat, OutChat, or a DM) to edit or delete it. Hover your own
message to see the ✎ and 🗑 icons; they disappear automatically once the
minute is up. Edits show an "(edited)" tag; deletions leave a "Message
deleted" placeholder for everyone, in real time.

## 11. Preparing for a public web release

This app ships with real application-level security hardening on by default:
- **Secure HTTP headers** via `helmet` (disables `X-Powered-By`, sets standard
  protective headers).
- **Rate limiting** — general API requests are capped, and login/signup/guest
  creation have a much tighter limit specifically to blunt brute-force and
  spam-account attempts.
- **CORS** reflects the request's origin by default (fine for LAN use). For a
  public deploy, set `ALLOWED_ORIGIN` in `.env` to your real domain so other
  websites can't make authenticated requests against your API from a
  visitor's browser.

**Important distinction:** none of the above is a literal network firewall.
A firewall is infrastructure — your router, your cloud provider's security
group, or a reverse proxy like Cloudflare or Nginx sitting in front of the
app — and it isn't something application code can create. What's built in
here reduces *this app's own* attack surface; it doesn't replace having
HTTPS (via a reverse proxy) and, ideally, a real firewall/WAF in front of it
once this is reachable from the public internet.

A few other things worth doing before a public release:
- Generate a fresh, long `JWT_SECRET` (see step 5) and never commit `.env` or
  `data.json` to version control (`.gitignore` already excludes both).
- Put a reverse proxy (Nginx, Caddy, or your host's built-in one) in front of
  the app to terminate HTTPS — this app itself speaks plain HTTP.
- If you want a stricter Content-Security-Policy than the default (currently
  left open because the login screen loads Google's Sign-In script and
  Google Fonts from their CDNs), tighten `helmet`'s `contentSecurityPolicy`
  option in `server/index.js` once you know your exact deployment domain.

## 12. Deploying so it's reachable beyond your LAN

If you eventually want it reachable outside the physical network too (e.g. via a
VPN mesh like Tailscale, a tunnel like Cloudflare Tunnel, or a full public cloud
deploy on Render/Railway), one setting matters:

In `.env`, set:
```
TRUST_PROXY=true
```
This makes the app read the real visitor IP from the `X-Forwarded-For` header
(set by the reverse proxy/tunnel) instead of the proxy's own IP — otherwise
every visitor would be auto-hashed into the *same* room regardless of their
actual network.

**Heads up:** once deployed publicly, NetChat's "same network = same room"
detection stops being meaningful — visitors from across the internet each
have their own public IP, so they won't auto-share a room the way people on
one WiFi network do. Use the manual room-name override to put specific
people in the same room on purpose. OutChat (invite-code channels) works
exactly the same either way — it was built for this.

### Free deployment on Render.com (no credit card)

Render's free tier supports Node.js + WebSockets with automatic HTTPS, no
card required. The one real limitation: **free services have an ephemeral
filesystem** — `data.json` and `uploads/` reset every time the service goes
idle (~15 min of no traffic) and wakes back up. Fine for demoing the app
publicly; not yet a permanent home for real conversations (that would need
migrating storage to a real database — a bigger follow-up project).

1. Push this project to a GitHub repository (GitHub Desktop is the easiest
   way if you don't use git from the command line — no `node_modules`,
   `data.json`, or `.env` need to be included; `.gitignore` already excludes them).
2. Create a free account at render.com (sign up with GitHub).
3. Dashboard → **New** → **Web Service** → select your repo.
4. Build command: `npm install`. Start command: `npm start`. Instance type: **Free**.
5. Under Environment Variables, add:
   - `JWT_SECRET` — a long random string (generate with
     `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
   - `TRUST_PROXY` — `true`
6. Click **Create Web Service**. After the first build finishes, you'll get a
   live URL like `https://your-app-name.onrender.com`.

## Project structure

```
network-chat/
├── server/
│   ├── index.js        # Express + Socket.io entry point
│   ├── db.js            # JSON-file data layer (users, rooms, messages, channels, friends, DMs)
│   ├── rooms.js          # IP-hash room resolution + manual override logic (NetChat)
│   ├── socket.js         # Real-time layer: NetChat, DMs, and OutChat channels
│   ├── middleware/auth.js
│   └── routes/
│       ├── auth.js       # signup / login / guest
│       ├── profile.js     # profile view/edit, password change
│       ├── friends.js     # friend requests, accept/decline/remove
│       ├── dm.js           # direct-message history
│       ├── outchat.js      # channels: create/join/approve/kick/transfer/leave
│       └── rooms.js        # NetChat: current room, override, report, upload
├── public/
│   ├── index.html
│   ├── icon.svg           # neon-green app icon / favicon
│   ├── css/style.css
│   └── js/app.js
├── uploads/               # shared files, organized by room ID
├── data.json               # created automatically on first run
└── .env
```

## How room detection works

- Each request's public IP is hashed (SHA-256, truncated) into a short room ID.
- Devices sharing a network share a public IP → they share a room automatically.
- A manual override (cookie-based) takes priority over IP detection when set.
- Messages, files, and reports are all scoped by `room_id` in `data.json` —
  one room's data is never visible to another.

## Known limitation: CGNAT

Mobile carriers and some public WiFi networks use CGNAT, where many unrelated
users share one public IP. This app can't distinguish between them by IP alone
— that's exactly what the manual room-name override is for.
