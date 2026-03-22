import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface StockHoldingRow {
  id: number;
  ticker: string;
  name: string;
  shares: number;
  avg_price: number | null;
  created_at: string;
}

export async function GET(): Promise<NextResponse> {
  const db = await getDb();

  const rows = db
    .query<StockHoldingRow, []>(
      'SELECT id, ticker, name, shares, avg_price, created_at FROM stock_holdings',
    )
    .all();

  const holdings = rows.map((row) => ({
    id: row.id,
    ticker: row.ticker,
    name: row.name,
    shares: row.shares,
    avgPrice: row.avg_price,
    createdAt: row.created_at,
  }));

  return NextResponse.json(holdings);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as {
    ticker?: string;
    name?: string;
    shares?: number;
    avg_price?: number | null;
  };

  const ticker = body.ticker?.trim();
  const name = body.name?.trim() ?? '';
  const shares = body.shares;
  const avgPrice = body.avg_price != null ? Number(body.avg_price) : null;

  if (!ticker || shares == null || shares <= 0) {
    return NextResponse.json({ error: 'ticker and shares are required' }, { status: 400 });
  }

  const db = await getDb();

  db.run('INSERT INTO stock_holdings (ticker, name, shares, avg_price) VALUES (?, ?, ?, ?)', [
    ticker.toUpperCase(),
    name,
    shares,
    avgPrice,
  ]);

  return NextResponse.json({ ok: true }, { status: 201 });
}
