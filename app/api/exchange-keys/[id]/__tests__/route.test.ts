import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import type { Database } from 'bun:sqlite';
import type { NextRequest, NextResponse } from 'next/server';

const TEST_KEY = 'a'.repeat(64);

type DeleteHandler = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => Promise<NextResponse>;

describe('DELETE /api/exchange-keys/[id]', () => {
  let DELETE: DeleteHandler;
  let db: Database;

  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    process.env.ENCRYPTION_KEY = TEST_KEY;

    const dbMod = await import('@/lib/db');
    db = await dbMod.getDb();

    const mod = await import('../route');
    DELETE = mod.DELETE as unknown as DeleteHandler;
  });

  afterAll(() => {
    delete process.env.DB_PATH;
    delete process.env.ENCRYPTION_KEY;
  });

  function makeContext(id: string) {
    return { params: { id } as unknown as Promise<{ id: string }> };
  }

  it('returns 404 when id does not exist', async () => {
    const response = await DELETE({} as NextRequest, makeContext('99999'));
    expect(response.status).toBe(404);
  });

  it('returns 204 when id exists', async () => {
    const row = db
      .query<{ id: number }, [string, string, string, string, string]>(
        `INSERT INTO exchange_keys (exchange, api_key, api_secret, iv, auth_tag)
         VALUES (?, ?, ?, ?, ?)
         RETURNING id`,
      )
      .get(
        'DeleteTest',
        'enc-key',
        'enc-secret',
        '{"apiKey":"iv1","apiSecret":"iv2"}',
        '{"apiKey":"tag1","apiSecret":"tag2"}',
      );

    expect(row).toBeDefined();
    const id = String(row!.id);

    const response = await DELETE({} as NextRequest, makeContext(id));
    expect(response.status).toBe(204);

    const deleted = db
      .query<{ id: number }, [string]>('SELECT id FROM exchange_keys WHERE id = ?')
      .get(id);
    expect(deleted).toBeNull();
  });
});
