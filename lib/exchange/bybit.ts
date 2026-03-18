import { createHmac } from 'crypto';

interface BybitCoin {
  usdValue: string;
}

interface BybitWalletInfo {
  totalEquity?: string;
  coin?: BybitCoin[];
}

interface BybitAccountResponse {
  retCode: number;
  retMsg: string;
  result: {
    list: BybitWalletInfo[];
  };
}

function sign(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

async function fetchWalletBalance(
  apiKey: string,
  apiSecret: string,
  accountType: string,
): Promise<BybitAccountResponse> {
  const timestamp = Date.now().toString();
  const recvWindow = '5000';
  const queryString = `accountType=${accountType}`;
  const prehash = `${timestamp}${apiKey}${recvWindow}${queryString}`;

  const response = await fetch(
    `https://api.bybit.com/v5/account/wallet-balance?${queryString}`,
    {
      headers: {
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-SIGN': sign(apiSecret, prehash),
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recvWindow,
      },
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Bybit API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as BybitAccountResponse;

  if (data.retCode !== 0) {
    throw new Error(`Bybit API error: ${data.retMsg}`);
  }

  return data;
}

export async function getBybitBalance(apiKey: string, apiSecret: string): Promise<number> {
  const [unified, fund] = await Promise.all([
    fetchWalletBalance(apiKey, apiSecret, 'UNIFIED'),
    fetchWalletBalance(apiKey, apiSecret, 'FUND'),
  ]);

  // UNIFIED account exposes totalEquity (USD)
  const unifiedTotal = parseFloat(unified.result.list[0]?.totalEquity ?? '0');

  // FUND account exposes per-coin usdValue
  const fundCoins = fund.result.list[0]?.coin ?? [];
  const fundTotal = fundCoins.reduce((sum, coin) => sum + parseFloat(coin.usdValue ?? '0'), 0);

  const total = unifiedTotal + fundTotal;

  console.log('[Bybit]', {
    unified: `$${unifiedTotal}`,
    fund: `$${fundTotal}`,
    fundCoins: fundCoins.map((c) => ({ ...c, usdValue: `$${c.usdValue}` })),
    total: `$${total}`,
  });

  return total;
}
