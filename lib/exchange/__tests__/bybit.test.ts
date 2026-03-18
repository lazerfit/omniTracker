import { afterEach, beforeAll, describe, expect, it, mock } from 'bun:test';

const UNIFIED_RESPONSE = {
  retCode: 0,
  retMsg: 'OK',
  result: { list: [{ totalEquity: '10000', coin: [] }] },
};

const FUND_RESPONSE = {
  retCode: 0,
  retMsg: 'OK',
  result: {
    list: [
      {
        coin: [
          { usdValue: '500' },
          { usdValue: '200.5' },
        ],
      },
    ],
  },
};

describe('getBybitBalance', () => {
  let getBybitBalance: (apiKey: string, apiSecret: string) => Promise<number>;
  let originalFetch: typeof global.fetch;

  beforeAll(async () => {
    const mod = await import('../bybit');
    getBybitBalance = mod.getBybitBalance;
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns UNIFIED totalEquity + FUND coin usdValue sum', async () => {
    const fetchMock = mock((url: string) => {
      if (url.includes('UNIFIED')) {
        return Promise.resolve(new Response(JSON.stringify(UNIFIED_RESPONSE), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(FUND_RESPONSE), { status: 200 }));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getBybitBalance('test-key', 'test-secret');

    // 10000 (UNIFIED) + 500 + 200.5 (FUND) = 10700.5
    expect(result).toBe(10700.5);
  });

  it('returns 0 when both lists are empty', async () => {
    const emptyResponse = { retCode: 0, retMsg: 'OK', result: { list: [] } };
    const fetchMock = mock(() =>
      Promise.resolve(new Response(JSON.stringify(emptyResponse), { status: 200 })),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getBybitBalance('test-key', 'test-secret');
    expect(result).toBe(0);
  });

  it('throws when HTTP status is not 200', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response('Unauthorized', { status: 401 })),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(getBybitBalance('bad-key', 'bad-secret')).rejects.toThrow('Bybit API error 401');
  });

  it('throws when retCode is non-zero', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ retCode: 10003, retMsg: 'Invalid api_key', result: { list: [] } }),
          { status: 200 },
        ),
      ),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(getBybitBalance('bad-key', 'bad-secret')).rejects.toThrow(
      'Bybit API error: Invalid api_key',
    );
  });
});
