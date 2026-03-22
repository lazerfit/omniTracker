import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, COOKIE_NAME } from '@/lib/session';

const PUBLIC_PATHS = ['/login', '/setup', '/api/auth'];
const SETUP_COOKIE = 'omnitracker-setup';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifySessionToken(token))) {
    const setupDone =
      request.cookies.get(SETUP_COOKIE)?.value === '1' ||
      (!!process.env.ADMIN_USERNAME && !!process.env.ADMIN_PASSWORD);
    const redirectPath = setupDone ? '/login' : '/setup';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};
