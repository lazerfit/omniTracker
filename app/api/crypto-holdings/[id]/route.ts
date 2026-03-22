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
  const body = (await request.json()) as { amount?: number; avg_price?: number | null };
  const amount = body.amount;
  const avgPrice = body.avg_price != null ? Number(body.avg_price) : null;

  if (amount == null || amount <= 0) {
    return NextResponse.json({ error: 'amount required' }, { status: 400 });
  }
  const db = await getDb();
  db.run('UPDATE crypto_holdings SET amount = ?, avg_price = ? WHERE id = ?', [
    amount,
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
  db.run('DELETE FROM crypto_holdings WHERE id = ?', [numericId]);

  return new NextResponse(null, { status: 204 });
}
