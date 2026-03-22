export interface CoinPrice {
  symbol: string;
  name: string;
  price: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume: number;
}

const COINS = [
  { symbol: 'BTCUSDT', ticker: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETHUSDT', ticker: 'ETH', name: 'Ethereum' },
  { symbol: 'BNBUSDT', ticker: 'BNB', name: 'BNB' },
  { symbol: 'SOLUSDT', ticker: 'SOL', name: 'Solana' },
  { symbol: 'XRPUSDT', ticker: 'XRP', name: 'XRP' },
];

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  quoteVolume: string;
}

interface BinanceSimplePrice {
  price: string;
}

// Coins that are pegged to $1 — no need to fetch price
const STABLECOINS = new Set(['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'FDUSD', 'USDP']);

export async function getCoinPrice(symbol: string): Promise<{ price: number; symbol: string }> {
  const upper = symbol.toUpperCase();
  if (STABLECOINS.has(upper)) {
    return { price: 1, symbol: upper };
  }

  const url = `https://api.binance.com/api/v3/ticker/price?symbol=${upper}USDT`;
  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    throw new Error(`Binance API error: ${res.status} for ${upper}`);
  }

  const data = (await res.json()) as BinanceSimplePrice;
  return { price: parseFloat(data.price), symbol: upper };
}

export async function getCoinPrices(): Promise<CoinPrice[]> {
  const symbols = COINS.map((c) => c.symbol);
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;

  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    throw new Error(`Binance API error: ${res.status}`);
  }

  const data = (await res.json()) as BinanceTicker[];

  const tickerMap = new Map<string, BinanceTicker>(data.map((t) => [t.symbol, t]));

  return COINS.map((coin) => {
    const ticker = tickerMap.get(coin.symbol);
    if (!ticker) {
      throw new Error(`No ticker data for ${coin.symbol}`);
    }
    return {
      symbol: coin.ticker,
      name: coin.name,
      price: parseFloat(ticker.lastPrice),
      changePercent24h: parseFloat(ticker.priceChangePercent),
      high24h: parseFloat(ticker.highPrice),
      low24h: parseFloat(ticker.lowPrice),
      volume: parseFloat(ticker.quoteVolume),
    };
  });
}
