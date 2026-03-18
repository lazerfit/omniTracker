import { afterEach, beforeAll, describe, expect, it, mock } from 'bun:test';

process.env.ENCRYPTION_KEY = 'a'.repeat(64);

describe('getBinanceBalance', () => {
  let getBinanceBalance: (apiKey: string, apiSecret: string) => Promise<number>;
  let originalFetch: typeof global.fetch;

  beforeAll(async () => {
    const mod = await import('../binance');
    getBinanceBalance = mod.getBinanceBalance;
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns the sum of stablecoin balances (USDT + USDC), excluding non-stablecoins', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            balances: [
              { asset: 'USDT', free: '100', locked: '50' },
              { asset: 'BTC', free: '0.5', locked: '0' },
              { asset: 'USDC', free: '200', locked: '0' },
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getBinanceBalance('test-key', 'test-secret');

    // USDT: 100 + 50 = 150, USDC: 200 + 0 = 200, BTC excluded → 350
    expect(result).toBe(350);
  });

  it('returns 0 when there are no stablecoin balances', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            balances: [{ asset: 'BTC', free: '1', locked: '0' }],
          }),
          { status: 200 },
        ),
      ),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getBinanceBalance('test-key', 'test-secret');

    expect(result).toBe(0);
  });

  it('throws when the API returns a non-200 status', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response('Unauthorized', { status: 401 })),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(getBinanceBalance('bad-key', 'bad-secret')).rejects.toThrow(
      'Binance API error 401',
    );
  });
});
