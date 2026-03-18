import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

interface SnapshotSumRow {
  snapshot_at: string;
  total: number;
}

export async function GET(): Promise<NextResponse> {
  const db = await getDb();

  // Sum all exchanges per snapshot day, get the latest two days
  const rows = db
    .query<SnapshotSumRow, []>(
      `SELECT DATE(snapshot_at) AS snapshot_at, SUM(total_value) AS total
       FROM portfolio_snapshots
       GROUP BY DATE(snapshot_at)
       ORDER BY snapshot_at DESC
       LIMIT 2`,
    )
    .all();

  if (rows.length < 2) {
    return NextResponse.json({ profit: null, profitPct: null, message: 'Not enough snapshots' });
  }

  const [latest, previous] = rows;
  const profit = latest.total - previous.total;
  const profitPct = previous.total !== 0 ? (profit / previous.total) * 100 : null;

  return NextResponse.json({
    profit,
    profitPct,
    currency: 'USD',
    from: previous.snapshot_at,
    to: latest.snapshot_at,
  });
}
