import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

interface ProfileRow {
  name: string;
  email: string;
  avatar_path: string;
}

export async function GET(): Promise<NextResponse> {
  const db = await getDb();
  const row = db.query<ProfileRow, []>('SELECT name, email, avatar_path FROM profile WHERE id = 1').get();
  return NextResponse.json({
    name: row?.name ?? '',
    email: row?.email ?? '',
    avatarUrl: row?.avatar_path ? `/uploads/${row.avatar_path}` : '',
  });
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const db = await getDb();
  const { name, email } = (await request.json()) as { name: string; email: string };
  db.run('UPDATE profile SET name = ?, email = ? WHERE id = 1', [name ?? '', email ?? '']);
  return NextResponse.json({ ok: true });
}
