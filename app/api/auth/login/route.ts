import { NextResponse } from 'next/server';
import { createSessionToken, COOKIE_NAME } from '@/lib/session';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still iterate over a to avoid timing leaks via early exit
    let guard = 0;
    for (let i = 0; i < a.length; i++) guard = (guard + a.charCodeAt(i)) & 0xff;
    void guard;
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: Request): Promise<NextResponse> {
  const { username, password } = (await request.json()) as {
    username: string;
    password: string;
  };

  const validUsername = process.env.AUTH_USERNAME ?? 'admin';
  const validPassword = process.env.AUTH_PASSWORD ?? '';

  if (!validPassword) {
    return NextResponse.json({ error: 'AUTH_PASSWORD is not configured.' }, { status: 500 });
  }

  const ok =
    timingSafeEqual(username ?? '', validUsername) &&
    timingSafeEqual(password ?? '', validPassword);

  if (!ok) {
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
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  });

  return response;
}
