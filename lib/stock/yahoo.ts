interface YahooChartMeta {
  regularMarketPrice: number;
  currency: string;
  longName?: string;
  shortName?: string;
  symbol: string;
}

interface YahooChartResult {
  meta: YahooChartMeta;
}

interface YahooChartResponse {
  chart: {
    result: YahooChartResult[] | null;
    error?: { code: string; description: string };
  };
}

export interface StockPrice {
  price: number;
  currency: string;
  name: string;
}

export async function getStockPrice(ticker: string): Promise<StockPrice> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
    },
  });

  if (!res.ok) {
    throw new Error(`Yahoo Finance error ${res.status} for ${ticker}`);
  }

  const data = (await res.json()) as YahooChartResponse;

  const result = data.chart.result?.[0];
  if (!result) {
    throw new Error(`No data returned from Yahoo Finance for ${ticker}`);
  }

  const { regularMarketPrice, currency, longName, shortName, symbol } = result.meta;

  return {
    price: regularMarketPrice,
    currency: currency ?? 'USD',
    name: longName ?? shortName ?? symbol ?? ticker,
  };
}
