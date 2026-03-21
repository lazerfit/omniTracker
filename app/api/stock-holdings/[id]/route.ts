import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

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
