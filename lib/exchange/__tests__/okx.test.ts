import { afterEach, beforeAll, describe, expect, it, mock } from 'bun:test';

process.env.ENCRYPTION_KEY = 'a'.repeat(64);

describe('getOkxBalance', () => {
  let getOkxBalance: (apiKey: string, apiSecret: string) => Promise<number>;
  let originalFetch: typeof global.fetch;

  beforeAll(async () => {
    const mod = await import('../okx');
    getOkxBalance = mod.getOkxBalance;
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns totalEq parsed from the first data entry', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ data: [{ totalEq: '2500.5' }] }),
          { status: 200 },
        ),
      ),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getOkxBalance('test-key', 'test-secret');

    expect(result).toBe(2500.5);
  });

  it('returns 0 when data is an empty array', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ data: [] }), { status: 200 }),
      ),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getOkxBalance('test-key', 'test-secret');

    expect(result).toBe(0);
  });

  it('throws when the API returns a non-200 status', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response('Internal Server Error', { status: 500 })),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(getOkxBalance('bad-key', 'bad-secret')).rejects.toThrow(
      'OKX API error 500',
    );
  });
});
