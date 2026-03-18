import { createHmac } from 'crypto';

interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

interface BinanceAccountResponse {
  balances: BinanceBalance[];
}

const STABLECOINS = new Set(['USDT', 'BUSD', 'USDC']);

export async function getBinanceBalance(apiKey: string, apiSecret: string): Promise<number> {
  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}`;

  const signature = createHmac('sha256', apiSecret).update(queryString).digest('hex');

  const url = `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`;

  const response = await fetch(url, {
    headers: {
      'X-MBX-APIKEY': apiKey,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Binance API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as BinanceAccountResponse;

  // TODO: implement full USD conversion using /api/v3/ticker/price for all assets
  // For now, only stablecoin balances (USDT, BUSD, USDC) are used as a USD proxy
  let total = 0;
  for (const balance of data.balances) {
    if (STABLECOINS.has(balance.asset)) {
      total += parseFloat(balance.free) + parseFloat(balance.locked);
    }
  }

  return total;
}
