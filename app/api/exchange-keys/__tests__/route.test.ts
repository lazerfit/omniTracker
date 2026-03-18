import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

const TEST_KEY = 'a'.repeat(64);

describe('GET /api/exchange-keys', () => {
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

  it('returns 200 with an array', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('masks apiKey as ****', async () => {
    // Insert a row first via POST so there is something to mask
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/exchange-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exchange: 'MaskTest',
        apiKey: 'my-real-api-key',
        apiSecret: 'my-real-api-secret',
      }),
    });
    await POST(request as import('next/server').NextRequest);

    const response = await GET();
    const body = await response.json();
    const entry = body.find((r: { exchange: string }) => r.exchange === 'MaskTest');
    expect(entry).toBeDefined();
    expect(entry.apiKey).toBe('****');
  });
});

describe('POST /api/exchange-keys', () => {
  let POST: (req: import('next/server').NextRequest) => Promise<import('next/server').NextResponse>;

  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    process.env.ENCRYPTION_KEY = TEST_KEY;
    const mod = await import('../route');
    POST = mod.POST;
  });

  afterAll(() => {
    delete process.env.DB_PATH;
    delete process.env.ENCRYPTION_KEY;
  });

  it('returns 400 when required fields are missing', async () => {
    const request = new Request('http://localhost/api/exchange-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exchange: 'Binance' }),
    });
    const response = await POST(request as import('next/server').NextRequest);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  it('returns 201 with id, exchange, createdAt on valid input', async () => {
    const request = new Request('http://localhost/api/exchange-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exchange: 'Binance',
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      }),
    });
    const response = await POST(request as import('next/server').NextRequest);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(typeof body.id).toBe('number');
    expect(body.exchange).toBe('Binance');
    expect(body.createdAt).toBeTruthy();
  });
});
