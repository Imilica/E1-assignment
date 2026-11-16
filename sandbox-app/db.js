const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(process.env.DB_FILE || path.join(dataDir, 'sandbox.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS test_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    expected_result TEXT NOT NULL,
    steps TEXT NOT NULL,
    automated INTEGER NOT NULL DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(password, salt, 32).toString('hex')}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const actual = crypto.scryptSync(password, salt, 32);
  return crypto.timingSafeEqual(actual, Buffer.from(hash, 'hex'));
}

const SEED_USERS = [
  { email: 'user@example.com', password: 'Password123!', role: 'user' },
  { email: 'admin@example.com', password: 'Admin123!', role: 'admin' },
];

function seed() {
  const insert = db.prepare('INSERT OR IGNORE INTO users (email, password_hash, role) VALUES (?, ?, ?)');
  for (const u of SEED_USERS) insert.run(u.email, hashPassword(u.password), u.role);
}

// Wipe all data and restore the seed users (used by tests for a clean state).
function reset() {
  db.exec('DELETE FROM sessions; DELETE FROM test_cases; DELETE FROM users;');
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users','test_cases')");
  seed();
}

seed();

module.exports = { db, verifyPassword, reset, SEED_USERS };
