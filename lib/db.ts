import { Database } from 'bun:sqlite';

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
}

export function getDb(): Database {
  if (_db) {
    return _db;
  }

  const dbPath = process.env.DB_PATH ?? './data/db.sqlite';
  _db = new Database(dbPath, { create: true });
  initDb(_db);

  return _db;
}
