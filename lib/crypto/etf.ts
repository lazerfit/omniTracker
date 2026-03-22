export interface EtfQuote {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
}

const BTC_ETF_TICKERS = ['IBIT', 'FBTC', 'GBTC', 'BITB', 'ARKB'];
const ETH_ETF_TICKERS = ['ETHA', 'FETH', 'ETHW', 'CETH'];

interface YahooChartMeta {
  regularMarketPrice: number;
  previousClose?: number;
  chartPreviousClose?: number;
  regularMarketVolume?: number;
  shortName?: string;
  longName?: string;
  symbol: string;
}

interface YahooChartResponse {
  chart: {
    result: { meta: YahooChartMeta }[] | null;
    error?: unknown;
  };
}

async function fetchSingleEtf(ticker: string): Promise<EtfQuote> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Yahoo Finance error: ${res.status} for ${ticker}`);
  const data = (await res.json()) as YahooChartResponse;
  const meta = data.chart?.result?.[0]?.meta;
  if (!meta) throw new Error(`No data for ${ticker}`);

  const prev = meta.previousClose ?? meta.chartPreviousClose ?? meta.regularMarketPrice;
  const changePercent = prev > 0 ? ((meta.regularMarketPrice - prev) / prev) * 100 : 0;

  return {
    ticker,
    name: meta.shortName ?? meta.longName ?? meta.symbol,
    price: meta.regularMarketPrice,
    changePercent,
    volume: meta.regularMarketVolume ?? 0,
  };
}

async function fetchEtfQuotes(tickers: string[]): Promise<EtfQuote[]> {
  const results = await Promise.allSettled(tickers.map(fetchSingleEtf));
  return results
    .filter((r): r is PromiseFulfilledResult<EtfQuote> => r.status === 'fulfilled')
    .map((r) => r.value);
}

export async function getBtcEtfQuotes(): Promise<EtfQuote[]> {
  return fetchEtfQuotes(BTC_ETF_TICKERS);
}

export async function getEthEtfQuotes(): Promise<EtfQuote[]> {
  return fetchEtfQuotes(ETH_ETF_TICKERS);
}
