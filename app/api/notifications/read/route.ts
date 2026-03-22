import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PATCH() {
  const db = await getDb();
  db.query('UPDATE notifications SET read = 1 WHERE read = 0').run();
  return NextResponse.json({ ok: true });
}
