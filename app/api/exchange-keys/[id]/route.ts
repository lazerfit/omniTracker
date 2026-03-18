import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = params as unknown as { id: string };
  const db = await getDb();

  const existing = db
    .query<{ id: number }, [string]>('SELECT id FROM exchange_keys WHERE id = ?')
    .get(id);

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  db.run('DELETE FROM exchange_keys WHERE id = ?', [id]);

  return new NextResponse(null, { status: 204 });
}
