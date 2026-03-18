import { afterEach, beforeAll, describe, expect, it, mock } from 'bun:test';

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

  it('returns totalEquity from the UNIFIED wallet', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            retCode: 0,
            retMsg: 'OK',
            result: { list: [{ totalEquity: '12345.67' }] },
          }),
          { status: 200 },
        ),
      ),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getBybitBalance('test-key', 'test-secret');
    expect(result).toBe(12345.67);
  });

  it('returns 0 when list is empty', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ retCode: 0, retMsg: 'OK', result: { list: [] } }),
          { status: 200 },
        ),
      ),
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

    await expect(getBybitBalance('bad-key', 'bad-secret')).rejects.toThrow('Bybit API error: Invalid api_key');
  });
});
