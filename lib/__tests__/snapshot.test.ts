import { afterEach, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import type { Database } from 'bun:sqlite';

// Must be set before any module that reads these env vars is imported
process.env.ENCRYPTION_KEY = 'a'.repeat(64);
process.env.DB_PATH = ':memory:';

describe('takeSnapshot', () => {
  let takeSnapshot: () => Promise<void>;
  let encrypt: (plaintext: string) => { encrypted: string; iv: string; authTag: string };
  let db: Database;
  let originalFetch: typeof global.fetch;

  beforeAll(async () => {
    const cryptoMod = await import('@/lib/crypto');
    encrypt = cryptoMod.encrypt;

    const dbMod = await import('@/lib/db');
    db = dbMod.getDb();

    const snapshotMod = await import('@/lib/snapshot');
    takeSnapshot = snapshotMod.takeSnapshot;

    originalFetch = global.fetch;
  });

  beforeEach(() => {
    // Clear any rows left over from other test files sharing the same in-memory DB singleton
    db.run('DELETE FROM exchange_keys');
    db.run('DELETE FROM portfolio_snapshots');
  });

  afterEach(() => {
    // Clean up rows inserted by each test to avoid cross-test contamination
    db.run('DELETE FROM exchange_keys');
    db.run('DELETE FROM portfolio_snapshots');
    global.fetch = originalFetch;
  });

  it('inserts a snapshot row when a valid Binance key exists', async () => {
    const apiKeyEncrypted = encrypt('test-api-key');
    const apiSecretEncrypted = encrypt('test-api-secret');

    db.run(
      `INSERT INTO exchange_keys (exchange, api_key, api_secret, iv, auth_tag)
       VALUES (?, ?, ?, ?, ?)`,
      [
        'Binance',
        apiKeyEncrypted.encrypted,
        apiSecretEncrypted.encrypted,
        JSON.stringify({ apiKey: apiKeyEncrypted.iv, apiSecret: apiSecretEncrypted.iv }),
        JSON.stringify({ apiKey: apiKeyEncrypted.authTag, apiSecret: apiSecretEncrypted.authTag }),
      ],
    );

    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            balances: [{ asset: 'USDT', free: '500', locked: '0' }],
          }),
          { status: 200 },
        ),
      ),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    await takeSnapshot();

    interface SnapshotRow {
      exchange: string;
      total_value: number;
    }

    const rows = db
      .query<SnapshotRow, []>('SELECT exchange, total_value FROM portfolio_snapshots')
      .all();

    expect(rows).toHaveLength(1);
    expect(rows[0].exchange).toBe('Binance');
    expect(rows[0].total_value).toBe(500);
  });

  it('does not throw when the exchange API call fails (per-exchange error isolation)', async () => {
    const apiKeyEncrypted = encrypt('test-api-key');
    const apiSecretEncrypted = encrypt('test-api-secret');

    db.run(
      `INSERT INTO exchange_keys (exchange, api_key, api_secret, iv, auth_tag)
       VALUES (?, ?, ?, ?, ?)`,
      [
        'Binance',
        apiKeyEncrypted.encrypted,
        apiSecretEncrypted.encrypted,
        JSON.stringify({ apiKey: apiKeyEncrypted.iv, apiSecret: apiSecretEncrypted.iv }),
        JSON.stringify({ apiKey: apiKeyEncrypted.authTag, apiSecret: apiSecretEncrypted.authTag }),
      ],
    );

    const fetchMock = mock(() =>
      Promise.resolve(new Response('Internal Server Error', { status: 500 })),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    // takeSnapshot catches per-exchange errors — must not propagate
    await expect(takeSnapshot()).resolves.toBeUndefined();

    // No snapshot row should have been inserted for the failed exchange
    interface CountRow {
      count: number;
    }
    const row = db
      .query<CountRow, []>('SELECT COUNT(*) as count FROM portfolio_snapshots')
      .get();

    expect(row?.count).toBe(0);
  });
});
