import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface CryptoHoldingRow {
  id: number;
  symbol: string;
  name: string;
  amount: number;
  avg_price: number | null;
  created_at: string;
}

export async function GET(): Promise<NextResponse> {
  const db = await getDb();

  const rows = db
    .query<CryptoHoldingRow, []>(
      'SELECT id, symbol, name, amount, avg_price, created_at FROM crypto_holdings',
    )
    .all();

  const holdings = rows.map((row) => ({
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    amount: row.amount,
    avgPrice: row.avg_price,
    createdAt: row.created_at,
  }));

  return NextResponse.json(holdings);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as {
    symbol?: string;
    name?: string;
    amount?: number;
    avg_price?: number | null;
  };

  const symbol = body.symbol?.trim();
  const name = body.name?.trim() ?? '';
  const amount = body.amount;
  const avgPrice = body.avg_price != null ? Number(body.avg_price) : null;

  if (!symbol || amount == null || amount <= 0) {
    return NextResponse.json({ error: 'symbol and amount are required' }, { status: 400 });
  }

  const db = await getDb();

  db.run('INSERT INTO crypto_holdings (symbol, name, amount, avg_price) VALUES (?, ?, ?, ?)', [
    symbol.toUpperCase(),
    name,
    amount,
    avgPrice,
  ]);

  return NextResponse.json({ ok: true }, { status: 201 });
}
