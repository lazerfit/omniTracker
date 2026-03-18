import { afterEach, beforeAll, describe, expect, it, mock } from 'bun:test';

process.env.ENCRYPTION_KEY = 'a'.repeat(64);

describe('getBitgetBalance', () => {
  let getBitgetBalance: (apiKey: string, apiSecret: string) => Promise<number>;
  let originalFetch: typeof global.fetch;

  beforeAll(async () => {
    const mod = await import('../bitget');
    getBitgetBalance = mod.getBitgetBalance;
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns the sum of usdtValuation across all assets', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              { coinName: 'BTC', usdtValuation: '1000' },
              { coinName: 'USDT', usdtValuation: '500' },
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getBitgetBalance('test-key', 'test-secret');

    expect(result).toBe(1500);
  });

  it('returns 0 when data is an empty array', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ data: [] }), { status: 200 }),
      ),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getBitgetBalance('test-key', 'test-secret');

    expect(result).toBe(0);
  });

  it('throws when the API returns a non-200 status', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response('Forbidden', { status: 403 })),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(getBitgetBalance('bad-key', 'bad-secret')).rejects.toThrow(
      'Bitget API error 403',
    );
  });
});
