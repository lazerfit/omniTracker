import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import type { Database } from 'bun:sqlite';
import type { NextRequest, NextResponse } from 'next/server';

const TEST_KEY = 'a'.repeat(64);

type DeleteHandler = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => NextResponse;

describe('DELETE /api/exchange-keys/[id]', () => {
  let DELETE: DeleteHandler;
  let db: Database;

  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    process.env.ENCRYPTION_KEY = TEST_KEY;

    // Initialise the DB singleton via getDb so tables exist
    const dbMod = await import('@/lib/db');
    db = dbMod.getDb();

    const mod = await import('../route');
    DELETE = mod.DELETE as unknown as DeleteHandler;
  });

  afterAll(() => {
    delete process.env.DB_PATH;
    delete process.env.ENCRYPTION_KEY;
  });

  // Helper: cast a plain params object to the shape the handler expects
  function makeContext(id: string) {
    return { params: { id } as unknown as Promise<{ id: string }> };
  }

  it('returns 404 when id does not exist', () => {
    const response = DELETE(
      {} as NextRequest,
      makeContext('99999'),
    );
    expect(response.status).toBe(404);
  });

  it('returns 204 when id exists', async () => {
    // Insert a row directly so we have a known id
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

    const response = DELETE({} as NextRequest, makeContext(id));
    expect(response.status).toBe(204);

    // Verify the row is gone
    const deleted = db
      .query<{ id: number }, [string]>('SELECT id FROM exchange_keys WHERE id = ?')
      .get(id);
    expect(deleted).toBeNull();
  });
});
