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

interface TickerPriceResponse {
  symbol: string;
  price: string;
}

export async function getBinanceBalance(apiKey: string, apiSecret: string): Promise<number> {
  const timestamp = Date.now();
  const queryString = `type=SPOT&limit=1&timestamp=${timestamp}`;
  const signature = createHmac('sha256', apiSecret).update(queryString).digest('hex');

  const [snapshotRes, btcPriceRes] = await Promise.all([
    fetch(`https://api.binance.com/sapi/v1/accountSnapshot?${queryString}&signature=${signature}`, {
      headers: { 'X-MBX-APIKEY': apiKey },
    }),
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

  const totalBtc = parseFloat(snapshot.snapshotVos[0]?.data.totalAssetOfBtc ?? '0');
  const btcUsdt = parseFloat(ticker.price);

  return totalBtc * btcUsdt;
}
