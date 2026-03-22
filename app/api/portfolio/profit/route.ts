import { getDb } from '@/lib/db';
import { getStockPrice } from '@/lib/stock/yahoo';
import { getUsdtKrwRate } from '@/lib/exchange/upbit';
import { NextResponse } from 'next/server';

interface StockRow {
  ticker: string;
  shares: number;
  avg_price: number | null;
}

interface SnapshotSumRow {
  snapshot_at: string;
  total: number;
}

export async function GET(): Promise<NextResponse> {
  const db = await getDb();
  const usdtKrw = await getUsdtKrwRate().catch(() => 1400);

  // ── Stock profit: real-time unrealized P&L ──────────────────────────────
  const stockRows = db
    .query<StockRow, []>(
      'SELECT ticker, shares, avg_price FROM stock_holdings WHERE avg_price IS NOT NULL',
    )
    .all();

  let stockProfitKrw = 0;
  let stockCostKrw = 0;

  if (stockRows.length > 0) {
    const results = await Promise.all(
      stockRows.map(async (row) => {
        try {
          const { price, currency } = await getStockPrice(row.ticker);
          const priceKrw = currency === 'KRW' ? price : price * usdtKrw;
          const avgPriceKrw = currency === 'KRW' ? row.avg_price! : row.avg_price! * usdtKrw;
          return {
            profit: (priceKrw - avgPriceKrw) * row.shares,
            cost: avgPriceKrw * row.shares,
          };
        } catch {
          return { profit: 0, cost: 0 };
        }
      }),
    );
    stockProfitKrw = results.reduce((s, r) => s + r.profit, 0);
    stockCostKrw = results.reduce((s, r) => s + r.cost, 0);
  }

  // ── Crypto profit: snapshot-based daily delta ───────────────────────────
  const snapRows = db
    .query<SnapshotSumRow, []>(
      `SELECT DATE(snapshot_at) AS snapshot_at, SUM(total_value) AS total
       FROM portfolio_snapshots
       GROUP BY DATE(snapshot_at)
       ORDER BY snapshot_at DESC
       LIMIT 2`,
    )
    .all();

  let cryptoProfitKrw: number | null = null;
  let cryptoProfitPct: number | null = null;
  let snapFrom: string | null = null;
  let snapTo: string | null = null;

  if (snapRows.length >= 2) {
    const [latest, previous] = snapRows;
    const profitUsd = latest.total - previous.total;
    cryptoProfitKrw = profitUsd * usdtKrw;
    cryptoProfitPct = previous.total !== 0 ? (profitUsd / previous.total) * 100 : null;
    snapFrom = previous.snapshot_at;
    snapTo = latest.snapshot_at;
  }

  return NextResponse.json({
    stock:
      stockRows.length > 0
        ? {
            profitKrw: stockProfitKrw,
            profitPct: stockCostKrw > 0 ? (stockProfitKrw / stockCostKrw) * 100 : null,
          }
        : null,
    crypto:
      cryptoProfitKrw !== null
        ? {
            profitKrw: cryptoProfitKrw,
            profitPct: cryptoProfitPct,
            from: snapFrom,
            to: snapTo,
          }
        : null,
  });
}
