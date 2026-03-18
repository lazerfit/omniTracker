import { createHmac } from 'crypto';

interface SnapshotData {
  totalAssetOfBtc: string;
}

interface SnapshotVo {
  data: SnapshotData;
  updateTime: number;
}

interface AccountSnapshotResponse {
  code: number;
  msg: string;
  snapshotVos: SnapshotVo[];
}

interface SimpleEarnAccountResponse {
  data: {
    totalAmountInBTC: string;
  };
}

interface TickerPriceResponse {
  symbol: string;
  price: string;
}

function sign(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export async function getBinanceBalance(apiKey: string, apiSecret: string): Promise<number> {
  const timestamp = Date.now();
  const headers = { 'X-MBX-APIKEY': apiKey };

  const snapshotQuery = `type=SPOT&limit=1&timestamp=${timestamp}`;
  const earnQuery = `timestamp=${timestamp}`;

  const [snapshotRes, earnRes, btcPriceRes] = await Promise.all([
    fetch(
      `https://api.binance.com/sapi/v1/accountSnapshot?${snapshotQuery}&signature=${sign(apiSecret, snapshotQuery)}`,
      { headers },
    ),
    fetch(
      `https://api.binance.com/sapi/v1/simple-earn/account?${earnQuery}&signature=${sign(apiSecret, earnQuery)}`,
      { headers },
    ),
    fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'),
  ]);

  if (!snapshotRes.ok) {
    const text = await snapshotRes.text();
    throw new Error(`Binance accountSnapshot error ${snapshotRes.status}: ${text}`);
  }
  if (!btcPriceRes.ok) {
    const text = await btcPriceRes.text();
    throw new Error(`Binance ticker/price error ${btcPriceRes.status}: ${text}`);
  }

  const snapshot = (await snapshotRes.json()) as AccountSnapshotResponse;
  const ticker = (await btcPriceRes.json()) as TickerPriceResponse;

  const spotBtc = parseFloat(snapshot.snapshotVos[0]?.data.totalAssetOfBtc ?? '0');

  // Simple Earn is optional — some API keys may not have earn permission
  let earnBtc = 0;
  if (earnRes.ok) {
    const earn = (await earnRes.json()) as SimpleEarnAccountResponse;
    earnBtc = parseFloat(earn.data?.totalAmountInBTC ?? '0');
  }

  const btcUsdt = parseFloat(ticker.price);
  return (spotBtc + earnBtc) * btcUsdt;
}
