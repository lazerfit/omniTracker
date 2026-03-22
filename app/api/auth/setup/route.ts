import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET(): Promise<NextResponse> {
  const db = await getDb();
  const row = db.query('SELECT id FROM auth_config LIMIT 1').get();
  return NextResponse.json({ done: row !== null });
}

export async function POST(request: Request): Promise<NextResponse> {
  const { username, password } = (await request.json()) as {
    username: string;
    password: string;
  };

  if (!username || typeof username !== 'string' || username.trim().length < 1) {
    return NextResponse.json({ error: '사용자명을 입력하세요.' }, { status: 400 });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });
  }

  const db = await getDb();
  const existing = db.query('SELECT id FROM auth_config LIMIT 1').get();
  if (existing) {
    return NextResponse.json({ error: '이미 설정이 완료되었습니다.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  db.run('INSERT INTO auth_config (id, username, password_hash) VALUES (1, ?, ?)', [
    username.trim(),
    passwordHash,
  ]);

  const response = NextResponse.json({ ok: true });
  response.cookies.set('omnitracker-setup', '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
  });
  return response;
}
