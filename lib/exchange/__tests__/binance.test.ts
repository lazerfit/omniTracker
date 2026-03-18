import { afterEach, beforeAll, describe, expect, it, mock } from 'bun:test';

process.env.ENCRYPTION_KEY = 'a'.repeat(64);

const SNAPSHOT_RESPONSE = {
  code: 200,
  msg: '',
  snapshotVos: [{ data: { totalAssetOfBtc: '0.5' }, updateTime: Date.now() }],
};

const EARN_RESPONSE = {
  data: { totalAmountInBTC: '0.1' },
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

  it('returns (spotBtc + earnBtc) * BTC/USDT price', async () => {
    const fetchMock = mock((url: string) => {
      if (url.includes('accountSnapshot')) {
        return Promise.resolve(new Response(JSON.stringify(SNAPSHOT_RESPONSE), { status: 200 }));
      }
      if (url.includes('simple-earn')) {
        return Promise.resolve(new Response(JSON.stringify(EARN_RESPONSE), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(BTC_PRICE_RESPONSE), { status: 200 }));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getBinanceBalance('test-key', 'test-secret');

    // (0.5 spot + 0.1 earn) BTC * $60,000 = $36,000
    expect(result).toBe(36000);
  });

  it('falls back to spot-only when simple-earn returns non-200', async () => {
    const fetchMock = mock((url: string) => {
      if (url.includes('accountSnapshot')) {
        return Promise.resolve(new Response(JSON.stringify(SNAPSHOT_RESPONSE), { status: 200 }));
      }
      if (url.includes('simple-earn')) {
        return Promise.resolve(new Response('Forbidden', { status: 403 }));
      }
      return Promise.resolve(new Response(JSON.stringify(BTC_PRICE_RESPONSE), { status: 200 }));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getBinanceBalance('test-key', 'test-secret');

    // 0.5 spot BTC * $60,000 = $30,000 (earn skipped)
    expect(result).toBe(30000);
  });

  it('throws when accountSnapshot returns a non-200 status', async () => {
    const fetchMock = mock((url: string) => {
      if (url.includes('accountSnapshot')) {
        return Promise.resolve(new Response('Unauthorized', { status: 401 }));
      }
      if (url.includes('simple-earn')) {
        return Promise.resolve(new Response(JSON.stringify(EARN_RESPONSE), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(BTC_PRICE_RESPONSE), { status: 200 }));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(getBinanceBalance('bad-key', 'bad-secret')).rejects.toThrow(
      'Binance accountSnapshot error 401',
    );
  });
});
