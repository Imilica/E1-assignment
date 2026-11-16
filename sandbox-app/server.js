const express = require('express');
const https = require('node:https');
const crypto = require('node:crypto');
const path = require('node:path');
const { db, verifyPassword, reset } = require('./db');
const { loadOrCreateCert } = require('./cert');

const PORT = Number(process.env.PORT || 3443);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAY = 24 * 60 * 60 * 1000;
const SESSION_TTL = DAY; // normal login
const REMEMBER_TTL = 30 * DAY; // "Remember me"

const app = express();
app.disable('x-powered-by');
app.use(express.json());

// ---------- auth helpers ----------
function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function currentUser(req) {
  const token = parseCookies(req).session;
  if (!token) return null;
  return db.prepare(
    `SELECT u.id, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > ?`
  ).get(token, Date.now()) || null;
}

function requireApiAuth(req, res, next) {
  req.user = currentUser(req);
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

function requirePageAuth(req, res, next) {
  req.user = currentUser(req);
  if (!req.user) return res.redirect('/login');
  next();
}

const page = (name) => (req, res) => res.sendFile(path.join(__dirname, 'public', name));

// ---------- pages ----------
app.get('/', (req, res) => res.redirect(currentUser(req) ? '/dashboard' : '/login'));
app.get('/login', page('login.html'));
app.get('/admin/login', page('admin-login.html'));
app.get('/forgot-password', page('forgot-password.html'));
app.get('/dashboard', requirePageAuth, page('dashboard.html'));
app.get('/test-cases', requirePageAuth, page('test-cases.html'));
app.get('/test-cases/new', requirePageAuth, page('new-test-case.html'));
app.use('/static', express.static(path.join(__dirname, 'public', 'static')));

// ---------- auth API ----------
function login(req, res, requiredRole) {
  const { email, password, remember } = req.body || {};
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (typeof password !== 'string' || password === '') {
    return res.status(400).json({ error: 'Password is required.' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  const ok = user && verifyPassword(password, user.password_hash) && (!requiredRole || user.role === requiredRole);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });

  const ttl = remember ? REMEMBER_TTL : SESSION_TTL;
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, user.id, Date.now() + ttl);

  // Without "Remember me" the cookie is a browser-session cookie; with it, it persists.
  const cookie = [`session=${token}`, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax'];
  if (remember) cookie.push(`Max-Age=${ttl / 1000}`);
  res.setHeader('Set-Cookie', cookie.join('; '));
  res.json({ redirect: '/dashboard', role: user.role });
}

app.post('/api/login', (req, res) => login(req, res, null));
app.post('/api/admin/login', (req, res) => login(req, res, 'admin'));

app.post('/api/logout', (req, res) => {
  const token = parseCookies(req).session;
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  res.setHeader('Set-Cookie', 'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/me', requireApiAuth, (req, res) => res.json(req.user));

app.post('/api/forgot-password', (req, res) => {
  const { email } = req.body || {};
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  // Always the same response so account existence is not leaked. No email is actually sent.
  res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
});

// ---------- test cases API ----------
const rowToCase = (r) => ({
  id: r.id, title: r.title, description: r.description, expectedResult: r.expected_result,
  steps: JSON.parse(r.steps), automated: !!r.automated, createdAt: r.created_at,
});

app.get('/api/test-cases', requireApiAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM test_cases ORDER BY id DESC').all().map(rowToCase));
});

app.post('/api/test-cases', requireApiAuth, (req, res) => {
  const b = req.body || {};
  const str = (v) => (typeof v === 'string' ? v.trim() : '');
  const errors = {};
  const title = str(b.title);
  const expectedResult = str(b.expectedResult);
  const steps = Array.isArray(b.steps) ? b.steps.map(str).filter(Boolean) : [];
  if (!title) errors.title = 'Title is required.';
  if (!expectedResult) errors.expectedResult = 'Expected Result is required.';
  if (steps.length === 0) errors.steps = 'At least one test step is required.';
  if (Object.keys(errors).length) return res.status(400).json({ errors });

  const info = db.prepare(
    `INSERT INTO test_cases (title, description, expected_result, steps, automated, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(title, str(b.description), expectedResult, JSON.stringify(steps), b.automated ? 1 : 0, req.user.id);
  const row = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(rowToCase(row));
});

app.delete('/api/test-cases/:id', requireApiAuth, (req, res) => {
  db.prepare('DELETE FROM test_cases WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// ---------- test helper: reset DB to seed state ----------
app.post('/api/test/reset', (req, res) => { reset(); res.json({ ok: true }); });

app.use((req, res) => res.status(404).send('Not found'));

https.createServer(loadOrCreateCert(), app).listen(PORT, () => {
  console.log(`Sandbox running at https://localhost:${PORT} (self-signed certificate)`);
});
