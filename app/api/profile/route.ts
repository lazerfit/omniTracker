import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ProfileRow {
  name: string;
  email: string;
  avatar_path: string;
}

export async function GET(): Promise<NextResponse> {
  const db = await getDb();
  const row = db.query<ProfileRow, []>('SELECT name, email, avatar_path FROM profile WHERE id = 1').get();

  let avatarUrl = '';
  if (row?.avatar_path) {
    const filePath = path.join(process.cwd(), 'public', 'uploads', row.avatar_path);
    const mtime = fs.existsSync(filePath) ? fs.statSync(filePath).mtimeMs : Date.now();
    avatarUrl = `/uploads/${row.avatar_path}?t=${mtime}`;
  }

  return NextResponse.json({
    name: row?.name ?? '',
    email: row?.email ?? '',
    avatarUrl,
  });
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const db = await getDb();
  const { name, email } = (await request.json()) as { name: string; email: string };
  db.run('UPDATE profile SET name = ?, email = ? WHERE id = 1', [name ?? '', email ?? '']);
  return NextResponse.json({ ok: true });
}
