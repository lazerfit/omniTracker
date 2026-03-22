import { type NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface PresetRow {
  id: number;
  name: string;
  targets_json: string;
  created_at: string;
}

export async function GET() {
  const db = await getDb();
  const rows = db
    .query<PresetRow, []>(
      'SELECT id, name, targets_json, created_at FROM rebalance_presets ORDER BY created_at DESC',
    )
    .all();

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      targetsJson: r.targets_json,
      createdAt: r.created_at,
    })),
  );
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    name: string;
    targets: { assetKey: string; targetPct: number }[];
  };

  const db = await getDb();
  const result = db
    .query<{ id: number }, [string, string]>(
      'INSERT INTO rebalance_presets (name, targets_json) VALUES (?, ?) RETURNING id',
    )
    .get(body.name, JSON.stringify(body.targets));

  return NextResponse.json({ id: result!.id, name: body.name }, { status: 201 });
}
