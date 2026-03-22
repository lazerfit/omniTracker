import { type NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface NotificationRow {
  id: number;
  title: string;
  body: string;
  read: number;
  created_at: string;
}

export async function GET() {
  const db = await getDb();
  const rows = db
    .query<NotificationRow, []>(
      'SELECT id, title, body, read, created_at FROM notifications ORDER BY created_at DESC LIMIT 20',
    )
    .all();

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      read: r.read === 1,
      createdAt: r.created_at,
    })),
  );
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { title: string; body?: string };

  const db = await getDb();
  const result = db
    .query<{ id: number }, [string, string]>(
      'INSERT INTO notifications (title, body) VALUES (?, ?) RETURNING id',
    )
    .get(body.title, body.body ?? '');

  return NextResponse.json({ id: result!.id }, { status: 201 });
}
