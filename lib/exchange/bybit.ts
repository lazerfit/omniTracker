import { createHmac } from 'crypto';

interface BybitWalletInfo {
  totalEquity: string;
}

interface BybitAccountResponse {
  retCode: number;
  retMsg: string;
  result: {
    list: BybitWalletInfo[];
  };
}

export async function getBybitBalance(apiKey: string, apiSecret: string): Promise<number> {
  const timestamp = Date.now().toString();
  const recvWindow = '5000';
  const queryString = 'accountType=UNIFIED';

  // HMAC-SHA256(timestamp + apiKey + recvWindow + queryString)
  const prehash = `${timestamp}${apiKey}${recvWindow}${queryString}`;
  const signature = createHmac('sha256', apiSecret).update(prehash).digest('hex');

  const response = await fetch(
    `https://api.bybit.com/v5/account/wallet-balance?${queryString}`,
    {
      headers: {
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-SIGN': signature,
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

  return parseFloat(data.result.list[0]?.totalEquity ?? '0');
}
