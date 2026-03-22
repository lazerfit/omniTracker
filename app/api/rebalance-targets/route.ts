import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface RebalanceTargetRow {
  ticker: string;
  target_pct: number;
}

export async function GET(): Promise<NextResponse> {
  const db = await getDb();

  const rows = db
    .query<RebalanceTargetRow, []>('SELECT ticker, target_pct FROM rebalance_targets')
    .all();

  const targets = rows.map((row) => ({
    ticker: row.ticker,
    targetPct: row.target_pct,
  }));

  return NextResponse.json(targets);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as {
    targets?: { ticker: string; targetPct: number }[];
  };

  if (!Array.isArray(body.targets)) {
    return NextResponse.json({ error: 'targets array is required' }, { status: 400 });
  }

  const db = await getDb();

  const upsert = db.prepare(
    `INSERT INTO rebalance_targets (ticker, target_pct) VALUES (?, ?)
     ON CONFLICT(ticker) DO UPDATE SET target_pct = excluded.target_pct`,
  );

  for (const { ticker, targetPct } of body.targets) {
    upsert.run(ticker, targetPct);
  }

  return NextResponse.json({ ok: true });
}
