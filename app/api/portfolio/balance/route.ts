import { decrypt } from '@/lib/crypto';
import { getDb } from '@/lib/db';
import { getBinanceBalance } from '@/lib/exchange/binance';
import { getBitgetBalance } from '@/lib/exchange/bitget';
import { getBybitBalance } from '@/lib/exchange/bybit';
import { getOkxBalance } from '@/lib/exchange/okx';
import { getUpbitBalance, getUsdtKrwRate } from '@/lib/exchange/upbit';
import { getStockPrice } from '@/lib/stock/yahoo';
import { getCoinPrice } from '@/lib/crypto/prices';
import { NextResponse } from 'next/server';

interface ExchangeKeyRow {
  id: number;
  exchange: string;
  api_key: string;
  api_secret: string;
  iv: string;
  auth_tag: string;
}

interface ExchangeBalance {
  exchange: string;
  balanceKrw: number;
  error?: string;
}

interface StockHoldingRow {
  id: number;
  ticker: string;
  name: string;
  shares: number;
}

interface CryptoHoldingRow {
  id: number;
  symbol: string;
  name: string;
  amount: number;
}

interface StockBalance {
  ticker: string;
  name: string;
  shares: number;
  priceKrw: number;
  totalKrw: number;
  error?: string;
}

export async function GET(): Promise<NextResponse> {
  const db = await getDb();

  const rows = db
    .query<ExchangeKeyRow, []>(
      'SELECT id, exchange, api_key, api_secret, iv, auth_tag FROM exchange_keys',
    )
    .all();

  const stockRows = db
    .query<StockHoldingRow, []>('SELECT id, ticker, name, shares FROM stock_holdings')
    .all();

  const cryptoRows = db
    .query<CryptoHoldingRow, []>('SELECT id, symbol, name, amount FROM crypto_holdings')
    .all();

  const usdtKrw = await getUsdtKrwRate();

  const results: ExchangeBalance[] = await Promise.all(
    rows.map(async (row) => {
      try {
        const ivObj = JSON.parse(row.iv) as { apiKey: string; apiSecret: string };
        const authTagObj = JSON.parse(row.auth_tag) as { apiKey: string; apiSecret: string };
        const apiKey = decrypt(row.api_key, ivObj.apiKey, authTagObj.apiKey);
        const apiSecret = decrypt(row.api_secret, ivObj.apiSecret, authTagObj.apiSecret);

        const exchange = row.exchange.toLowerCase();
        let balanceKrw: number;

        if (exchange === 'binance') {
          balanceKrw = (await getBinanceBalance(apiKey, apiSecret)) * usdtKrw;
        } else if (exchange === 'bybit') {
          balanceKrw = (await getBybitBalance(apiKey, apiSecret)) * usdtKrw;
        } else if (exchange === 'bitget') {
          balanceKrw = (await getBitgetBalance(apiKey, apiSecret)) * usdtKrw;
        } else if (exchange === 'okx') {
          balanceKrw = (await getOkxBalance(apiKey, apiSecret)) * usdtKrw;
        } else if (exchange === 'upbit') {
          balanceKrw = await getUpbitBalance(apiKey, apiSecret);
        } else {
          return { exchange: row.exchange, balanceKrw: 0, error: 'Unsupported exchange' };
        }

        return { exchange: row.exchange, balanceKrw };
      } catch (err) {
        return {
          exchange: row.exchange,
          balanceKrw: 0,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    }),
  );

  const stockResults: StockBalance[] = await Promise.all(
    stockRows.map(async (row) => {
      try {
        const { price, currency, name } = await getStockPrice(row.ticker);
        const priceKrw = currency === 'KRW' ? price : price * usdtKrw;
        const totalKrw = priceKrw * row.shares;
        return {
          ticker: row.ticker,
          name: row.name || name,
          shares: row.shares,
          priceKrw,
          totalKrw,
        };
      } catch (err) {
        console.error(`[stock] ${row.ticker} price fetch failed:`, err);
        return {
          ticker: row.ticker,
          name: row.name,
          shares: row.shares,
          priceKrw: 0,
          totalKrw: 0,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    }),
  );

  const cryptoResults: ExchangeBalance[] = await Promise.all(
    cryptoRows.map(async (row) => {
      try {
        const { price } = await getCoinPrice(row.symbol);
        const balanceKrw = price * row.amount * usdtKrw;
        return { exchange: row.name || row.symbol, balanceKrw };
      } catch (err) {
        return {
          exchange: row.name || row.symbol,
          balanceKrw: 0,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    }),
  );

  const exchangeTotal = results.reduce((sum, r) => sum + r.balanceKrw, 0);
  const cryptoManualTotal = cryptoResults.reduce((sum, r) => sum + r.balanceKrw, 0);
  const stockTotal = stockResults.reduce((sum, r) => sum + r.totalKrw, 0);
  const total = exchangeTotal + cryptoManualTotal + stockTotal;

  return NextResponse.json({
    total,
    currency: 'KRW',
    exchanges: [...results, ...cryptoResults],
    stocks: stockResults,
  });
}
