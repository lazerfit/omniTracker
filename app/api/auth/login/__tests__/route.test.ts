import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

const TEST_KEY = 'a'.repeat(64);

describe('POST /api/auth/login', () => {
  let POST: (req: Request) => Promise<import('next/server').NextResponse>;

  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    process.env.ENCRYPTION_KEY = TEST_KEY;

    // Clear any rows left by prior test files sharing the same in-memory DB singleton,
    // then seed auth_config with known credentials via the setup route.
    const { getDb } = await import('@/lib/db');
    const db = await getDb();
    db.run('DELETE FROM auth_config');

    const setupMod = await import('@/app/api/auth/setup/route');
    const setupReq = new Request('http://localhost/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', password: 'testpassword123' }),
    });
    await setupMod.POST(setupReq);

    const mod = await import('../route');
    POST = mod.POST;
  });

  afterAll(() => {
    delete process.env.DB_PATH;
    delete process.env.ENCRYPTION_KEY;
  });

  it('returns 401 for wrong password', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', password: 'wrongpassword' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('returns 401 for wrong username', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'wronguser', password: 'testpassword123' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 200 and sets session cookie for correct credentials', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', password: 'testpassword123' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('omnitracker-session');
  });
});
