import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'database.sqlite');

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'staff',
      staff_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT DEFAULT 'ready',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      notes TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES assets(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS repairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      cost INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (asset_id) REFERENCES assets(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  try {
    db.exec(`ALTER TABLE assets ADD COLUMN notes TEXT;`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE users ADD COLUMN staff_code TEXT;`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE users ADD COLUMN is_locked INTEGER DEFAULT 0;`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE users ADD COLUMN can_borrow INTEGER DEFAULT 1;`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE users ADD COLUMN can_repair INTEGER DEFAULT 0;`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE users ADD COLUMN can_manage_users INTEGER DEFAULT 0;`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE users ADD COLUMN is_approved INTEGER DEFAULT 0;`);
  } catch (e) {}

  // Insert default admin if not exists
  const admin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@fpt.edu.vn');
  if (!admin) {
    db.prepare('INSERT INTO users (email, password, name, role, is_approved, can_borrow, can_repair, can_manage_users) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      'admin@fpt.edu.vn', 'admin123', 'Admin FPT', 'admin', 1, 1, 1, 1
    );
  } else {
    // Ensure existing admin is approved
    db.prepare('UPDATE users SET is_approved = 1 WHERE email = ?').run('admin@fpt.edu.vn');
  }
}
