import { NextResponse } from 'next/server';
import { createSessionToken, COOKIE_NAME } from '@/lib/session';
import { verifyPassword } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(request: Request): Promise<NextResponse> {
  const { username, password } = (await request.json()) as {
    username: string;
    password: string;
  };

  const db = await getDb();
  const row = db
    .query<{ username: string; password_hash: string }, []>(
      'SELECT username, password_hash FROM auth_config LIMIT 1',
    )
    .get();

  if (!row) {
    const res = NextResponse.json({ error: 'setup_required' }, { status: 503 });
    res.cookies.set('omnitracker-setup', '', { maxAge: 0, path: '/' });
    return res;
  }

  const usernameMatch = username === row.username;
  const passwordMatch = await verifyPassword(password ?? '', row.password_hash);

  if (!usernameMatch || !passwordMatch) {
    return NextResponse.json(
      { error: '사용자명 또는 비밀번호가 올바르지 않습니다.' },
      { status: 401 },
    );
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
  return response;
}
