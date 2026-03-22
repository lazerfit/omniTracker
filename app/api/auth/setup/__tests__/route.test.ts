import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

const TEST_KEY = 'a'.repeat(64);

describe('GET /api/auth/setup', () => {
  let GET: () => Promise<import('next/server').NextResponse>;

  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    process.env.ENCRYPTION_KEY = TEST_KEY;
    const mod = await import('../route');
    GET = mod.GET;
  });

  afterAll(() => {
    delete process.env.DB_PATH;
    delete process.env.ENCRYPTION_KEY;
  });

  it('returns { done: false } when no credentials exist', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.done).toBe(false);
  });
});

describe('POST /api/auth/setup', () => {
  let GET: () => Promise<import('next/server').NextResponse>;
  let POST: (req: Request) => Promise<import('next/server').NextResponse>;

  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    process.env.ENCRYPTION_KEY = TEST_KEY;
    const mod = await import('../route');
    GET = mod.GET;
    POST = mod.POST;
  });

  afterAll(() => {
    delete process.env.DB_PATH;
    delete process.env.ENCRYPTION_KEY;
  });

  it('returns 400 when username is empty', async () => {
    const req = new Request('http://localhost/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '', password: 'password123' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('returns 400 when password is shorter than 8 chars', async () => {
    const req = new Request('http://localhost/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'short' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('returns 200 and sets setup cookie on valid first-time setup', async () => {
    const req = new Request('http://localhost/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'securepassword' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('omnitracker-setup=1');
  });

  it('returns { done: true } after setup', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.done).toBe(true);
  });

  it('returns 409 when trying to set up again', async () => {
    const req = new Request('http://localhost/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin2', password: 'anotherpassword' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });
});
