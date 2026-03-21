import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface StockHoldingRow {
  id: number;
  ticker: string;
  name: string;
  shares: number;
  created_at: string;
}

export async function GET(): Promise<NextResponse> {
  const db = await getDb();

  const rows = db
    .query<StockHoldingRow, []>('SELECT id, ticker, name, shares, created_at FROM stock_holdings')
    .all();

  const holdings = rows.map((row) => ({
    id: row.id,
    ticker: row.ticker,
    name: row.name,
    shares: row.shares,
    createdAt: row.created_at,
  }));

  return NextResponse.json(holdings);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as { ticker?: string; name?: string; shares?: number };

  const ticker = body.ticker?.trim();
  const name = body.name?.trim() ?? '';
  const shares = body.shares;

  if (!ticker || shares == null || shares <= 0) {
    return NextResponse.json({ error: 'ticker and shares are required' }, { status: 400 });
  }

  const db = await getDb();

  db.run('INSERT INTO stock_holdings (ticker, name, shares) VALUES (?, ?, ?)', [
    ticker.toUpperCase(),
    name,
    shares,
  ]);

  return NextResponse.json({ ok: true }, { status: 201 });
}
