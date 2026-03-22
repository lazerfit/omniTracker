import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

interface PortfolioRebalanceTargetRow {
  asset_key: string;
  target_pct: number;
}

interface TargetItem {
  assetKey: string;
  targetPct: number;
}

interface PostBody {
  targets: TargetItem[];
}

export async function GET(): Promise<NextResponse> {
  const db = await getDb();
  const rows = db
    .query<PortfolioRebalanceTargetRow, []>(
      'SELECT asset_key, target_pct FROM portfolio_rebalance_targets',
    )
    .all();

  const data: TargetItem[] = rows.map((r) => ({
    assetKey: r.asset_key,
    targetPct: r.target_pct,
  }));

  return NextResponse.json(data);
}

export async function POST(req: Request): Promise<NextResponse> {
  const body = (await req.json()) as PostBody;
  const { targets } = body;

  if (!Array.isArray(targets)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const db = await getDb();
  const upsert = db.prepare(
    `INSERT INTO portfolio_rebalance_targets (asset_key, target_pct) VALUES (?, ?)
     ON CONFLICT(asset_key) DO UPDATE SET target_pct = excluded.target_pct`,
  );

  for (const { assetKey, targetPct } of targets) {
    upsert.run(assetKey, targetPct);
  }

  return NextResponse.json({ ok: true });
}
