import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const body = (await request.json()) as { shares?: number; avg_price?: number | null };
  const shares = body.shares;
  const avgPrice = body.avg_price != null ? Number(body.avg_price) : null;

  if (shares == null || shares <= 0) {
    return NextResponse.json({ error: 'shares required' }, { status: 400 });
  }
  const db = await getDb();
  db.run('UPDATE stock_holdings SET shares = ?, avg_price = ? WHERE id = ?', [
    shares,
    avgPrice,
    numericId,
  ]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const numericId = parseInt(id, 10);

  if (isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const db = await getDb();
  db.run('DELETE FROM stock_holdings WHERE id = ?', [numericId]);

  return new NextResponse(null, { status: 204 });
}
