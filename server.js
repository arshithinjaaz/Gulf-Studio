/* ============================================================
   Gulf Studio FZE LLC — CMS Server
   Run:  node server.js
   Admin: http://localhost:3000/admin
   Pass:  gulfstudio2026  (change ADMIN_PASS below)
   ============================================================ */

const express = require('express');
const session = require('express-session');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT       = process.env.PORT       || 3000;
const ADMIN_PASS = process.env.ADMIN_PASS || 'gulfstudio2026';
const SESSION_SECRET = 'gs-cms-session-secret-7f3x';
const DATA_FILE  = path.join(__dirname, 'data', 'content.json');
const DEFAULT_FILE = path.join(__dirname, 'data', 'content.default.json');

/* ── Ensure data directory & default content file exist ── */
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(DATA_FILE) && fs.existsSync(DEFAULT_FILE)) {
  fs.copyFileSync(DEFAULT_FILE, DATA_FILE);
}

/* ── Middleware ── */
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }
}));

/* ── Image upload setup ── */
/* ── Image upload ── */
const imageStorage = multer.diskStorage({
  destination (req, file, cb) {
    const dir = path.join(__dirname, 'assets', 'images', 'uploads');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename (req, file, cb) {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, name);
  }
});
const upload = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter (req, file, cb) {
    if (/^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

/* ── Video upload ── */
const videoStorage = multer.diskStorage({
  destination (req, file, cb) {
    const dir = path.join(__dirname, 'assets', 'videos', 'uploads');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename (req, file, cb) {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, name);
  }
});
const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter (req, file, cb) {
    if (/^video\/(mp4|webm|ogg|quicktime|x-msvideo|x-matroska)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only video files are allowed (mp4, webm, mov, avi, mkv)'));
  }
});

/* ── Auth guard ── */
const requireAuth = (req, res, next) => {
  if (req.session.admin) return next();
  res.status(401).json({ error: 'Not authenticated' });
};

/* ─────────────────────────────────────
   PUBLIC API
───────────────────────────────────── */

app.get('/api/content', (req, res) => {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    res.json(JSON.parse(raw));
  } catch {
    res.json({});
  }
});

app.get('/api/auth', (req, res) => {
  res.json({ ok: !!req.session.admin });
});

app.post('/api/login', (req, res) => {
  if (req.body.password === ADMIN_PASS) {
    req.session.admin = true;
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: 'Incorrect password' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

/* ─────────────────────────────────────
   PROTECTED API
───────────────────────────────────── */

/* Save full content object */
app.post('/api/content', requireAuth, (req, res) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* Upload image, returns URL */
app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = '/assets/images/uploads/' + req.file.filename;
  res.json({ ok: true, url });
});

app.post('/api/upload-video', requireAuth, uploadVideo.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = '/assets/videos/uploads/' + req.file.filename;
  res.json({ ok: true, url });
});

/* ── Admin panel ── */
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

/* ── Start ── */
app.listen(PORT, () => {
  console.log('\n  ╔══════════════════════════════════════╗');
  console.log('  ║   Gulf Studio FZE LLC — Admin CMS   ║');
  console.log('  ╚══════════════════════════════════════╝\n');
  console.log(`  Site:      http://localhost:${PORT}`);
  console.log(`  Admin:     http://localhost:${PORT}/admin`);
  console.log(`  Password:  ${ADMIN_PASS}\n`);
});
