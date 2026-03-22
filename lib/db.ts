import type { Database } from 'bun:sqlite';

let _db: Database | null = null;

function initDb(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS exchange_keys (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      exchange   TEXT NOT NULL,
      api_key    TEXT NOT NULL,
      api_secret TEXT NOT NULL,
      iv         TEXT NOT NULL,
      auth_tag   TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      exchange    TEXT NOT NULL,
      total_value REAL NOT NULL,
      currency    TEXT NOT NULL DEFAULT 'USD',
      snapshot_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS stock_holdings (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker     TEXT NOT NULL,
      name       TEXT NOT NULL DEFAULT '',
      shares     REAL NOT NULL,
      avg_price  REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  try {
    db.run('ALTER TABLE stock_holdings ADD COLUMN avg_price REAL');
  } catch {
    // column already exists, ignore
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS crypto_holdings (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol     TEXT NOT NULL,
      name       TEXT NOT NULL DEFAULT '',
      amount     REAL NOT NULL,
      avg_price  REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rebalance_targets (
      ticker     TEXT PRIMARY KEY,
      target_pct REAL NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS portfolio_rebalance_targets (
      asset_key  TEXT PRIMARY KEY,
      target_pct REAL NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rebalance_presets (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT NOT NULL,
      targets_json TEXT NOT NULL,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT NOT NULL,
      body       TEXT NOT NULL DEFAULT '',
      read       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS profile (
      id          INTEGER PRIMARY KEY DEFAULT 1,
      name        TEXT NOT NULL DEFAULT '',
      email       TEXT NOT NULL DEFAULT '',
      avatar_path TEXT NOT NULL DEFAULT ''
    )
  `);
  db.run(`INSERT OR IGNORE INTO profile (id) VALUES (1)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS auth_config (
      id            INTEGER PRIMARY KEY DEFAULT 1,
      username      TEXT NOT NULL,
      password_hash TEXT NOT NULL
    )
  `);
}

export async function getDb(): Promise<Database> {
  if (_db) {
    return _db;
  }

  type BunSqliteModule = typeof import('bun:sqlite');
  const bunSqlite = 'bun:sqlite';
  const { Database: DB } = (await import(/* webpackIgnore: true */ bunSqlite)) as BunSqliteModule;
  const dbPath = process.env.DB_PATH ?? './data/db.sqlite';
  _db = new DB(dbPath, { create: true });
  initDb(_db);

  // Sync admin credentials from env vars (always takes precedence when set)
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (adminUser && adminPass) {
    const { hashPassword } = await import('./auth');
    const hash = await hashPassword(adminPass);
    _db.run(
      'INSERT OR REPLACE INTO auth_config (id, username, password_hash) VALUES (1, ?, ?)',
      [adminUser, hash],
    );
  }

  return _db;
}
