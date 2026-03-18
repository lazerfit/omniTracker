import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import type { Database } from 'bun:sqlite';

describe('getDb', () => {
  let getDb: () => Promise<Database>;

  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    const mod = await import('@/lib/db');
    getDb = mod.getDb;
  });

  afterAll(() => {
    delete process.env.DB_PATH;
  });

  it('returns a Database instance', async () => {
    const db = await getDb();
    expect(db).toBeDefined();
    expect(typeof db.query).toBe('function');
  });

  it('calling getDb() twice returns the same singleton instance', async () => {
    const a = await getDb();
    const b = await getDb();
    expect(a).toBe(b);
  });

  it('exchange_keys table exists after init', async () => {
    const db = await getDb();
    const row = db
      .query<{ name: string }, [string]>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      )
      .get('exchange_keys');
    expect(row?.name).toBe('exchange_keys');
  });

  it('portfolio_snapshots table exists after init', async () => {
    const db = await getDb();
    const row = db
      .query<{ name: string }, [string]>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      )
      .get('portfolio_snapshots');
    expect(row?.name).toBe('portfolio_snapshots');
  });

  it('can insert and query a row in exchange_keys', async () => {
    const db = await getDb();
    db.run(
      `INSERT INTO exchange_keys (exchange, api_key, api_secret, iv, auth_tag)
       VALUES ('TestExchange', 'enc-key', 'enc-secret', '{"apiKey":"iv1","apiSecret":"iv2"}', '{"apiKey":"tag1","apiSecret":"tag2"}')`,
    );
    const row = db
      .query<{ exchange: string }, [string]>(
        'SELECT exchange FROM exchange_keys WHERE exchange = ?',
      )
      .get('TestExchange');
    expect(row?.exchange).toBe('TestExchange');
  });

  it('can insert and query a row in portfolio_snapshots', async () => {
    const db = await getDb();
    db.run(
      `INSERT INTO portfolio_snapshots (exchange, total_value, currency)
       VALUES ('TestExchange', 12345.67, 'USD')`,
    );
    const row = db
      .query<{ total_value: number }, [string]>(
        'SELECT total_value FROM portfolio_snapshots WHERE exchange = ?',
      )
      .get('TestExchange');
    expect(row?.total_value).toBe(12345.67);
  });
});
