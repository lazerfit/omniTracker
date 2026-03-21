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
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
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

  return _db;
}
