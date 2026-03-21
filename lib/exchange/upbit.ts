import { createHmac } from 'crypto';

interface UpbitAccount {
  currency: string;
  balance: string;
  locked: string;
}

interface UpbitTicker {
  market: string;
  trade_price: number;
}

interface UpbitMarket {
  market: string;
}

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function createJWT(payload: object, secret: string): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const sig = base64url(createHmac('sha256', secret).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

async function getKrwMarkets(): Promise<Set<string>> {
  const res = await fetch('https://api.upbit.com/v1/market/all?is_details=false');
  if (!res.ok) throw new Error(`Upbit market/all error ${res.status}`);
  const markets = (await res.json()) as UpbitMarket[];
  return new Set(markets.filter((m) => m.market.startsWith('KRW-')).map((m) => m.market));
}

export async function getUpbitBalance(apiKey: string, apiSecret: string): Promise<number> {
  const token = createJWT({ access_key: apiKey, nonce: crypto.randomUUID() }, apiSecret);

  const [accountsRes, krwMarkets] = await Promise.all([
    fetch('https://api.upbit.com/v1/accounts', {
      headers: { Authorization: `Bearer ${token}` },
    }),
    getKrwMarkets(),
  ]);

  if (!accountsRes.ok) {
    const text = await accountsRes.text();
    throw new Error(`Upbit accounts error ${accountsRes.status}: ${text}`);
  }

  const accounts = (await accountsRes.json()) as UpbitAccount[];

  const krwAccount = accounts.find((a) => a.currency === 'KRW');
  const krwBalance =
    parseFloat(krwAccount?.balance ?? '0') + parseFloat(krwAccount?.locked ?? '0');

  // KRW 마켓이 존재하는 코인만 필터링 (없는 코인을 포함하면 ticker 요청 전체가 400)
  const nonKrw = accounts.filter((a) => {
    if (a.currency === 'KRW') return false;
    if (!krwMarkets.has(`KRW-${a.currency}`)) return false;
    return parseFloat(a.balance) + parseFloat(a.locked) > 0;
  });

  let nonKrwValue = 0;
  if (nonKrw.length > 0) {
    const marketIds = nonKrw.map((a) => `KRW-${a.currency}`).join(',');
    const tickerRes = await fetch(`https://api.upbit.com/v1/ticker?markets=${marketIds}`);
    if (!tickerRes.ok) {
      const text = await tickerRes.text();
      throw new Error(`Upbit ticker error ${tickerRes.status}: ${text}`);
    }
    const tickers = (await tickerRes.json()) as UpbitTicker[];
    const priceMap = new Map(tickers.map((t) => [t.market.replace('KRW-', ''), t.trade_price]));

    for (const account of nonKrw) {
      const price = priceMap.get(account.currency) ?? 0;
      nonKrwValue += (parseFloat(account.balance) + parseFloat(account.locked)) * price;
    }
  }

  const total = krwBalance + nonKrwValue;

  console.log('[Upbit]', {
    krw: `₩${krwBalance.toLocaleString()}`,
    nonKrwAssets: nonKrw.map((a) => ({
      currency: a.currency,
      amount: parseFloat(a.balance) + parseFloat(a.locked),
    })),
    total: `₩${total.toLocaleString()}`,
  });

  return total;
}

export async function getUsdtKrwRate(): Promise<number> {
  const res = await fetch('https://api.upbit.com/v1/ticker?markets=KRW-USDT');
  if (!res.ok) throw new Error(`Upbit USDT/KRW ticker error ${res.status}`);
  const [ticker] = (await res.json()) as UpbitTicker[];
  return ticker.trade_price;
}
