import { afterEach, beforeAll, describe, expect, it, mock } from 'bun:test';

process.env.ENCRYPTION_KEY = 'a'.repeat(64);

const SNAPSHOT_RESPONSE = {
  code: 200,
  msg: '',
  snapshotVos: [{ data: { totalAssetOfBtc: '0.5' }, updateTime: Date.now() }],
};

const BTC_PRICE_RESPONSE = { symbol: 'BTCUSDT', price: '60000' };

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

  it('returns totalAssetOfBtc * BTC/USDT price', async () => {
    const fetchMock = mock((url: string) => {
      if (url.includes('accountSnapshot')) {
        return Promise.resolve(new Response(JSON.stringify(SNAPSHOT_RESPONSE), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(BTC_PRICE_RESPONSE), { status: 200 }));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getBinanceBalance('test-key', 'test-secret');

    // 0.5 BTC * $60,000 = $30,000
    expect(result).toBe(30000);
  });

  it('returns 0 when totalAssetOfBtc is 0', async () => {
    const emptySnapshot = {
      ...SNAPSHOT_RESPONSE,
      snapshotVos: [{ data: { totalAssetOfBtc: '0' }, updateTime: Date.now() }],
    };
    const fetchMock = mock((url: string) => {
      if (url.includes('accountSnapshot')) {
        return Promise.resolve(new Response(JSON.stringify(emptySnapshot), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(BTC_PRICE_RESPONSE), { status: 200 }));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getBinanceBalance('test-key', 'test-secret');
    expect(result).toBe(0);
  });

  it('throws when accountSnapshot returns a non-200 status', async () => {
    const fetchMock = mock((url: string) => {
      if (url.includes('accountSnapshot')) {
        return Promise.resolve(new Response('Unauthorized', { status: 401 }));
      }
      return Promise.resolve(new Response(JSON.stringify(BTC_PRICE_RESPONSE), { status: 200 }));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(getBinanceBalance('bad-key', 'bad-secret')).rejects.toThrow(
      'Binance accountSnapshot error 401',
    );
  });
});
