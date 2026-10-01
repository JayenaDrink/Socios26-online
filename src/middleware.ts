import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, getAppPassword, sessionToken, safeEqual } from '@/lib/auth';

// Everything requires the shared password except the login page and login API
const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  const password = getAppPassword();
  if (!password) {
    // No password configured: allow on a local dev server, block when deployed
    if (process.env.NODE_ENV === 'development') return NextResponse.next();
    return new NextResponse('APP_PASSWORD is not configured on the server.', { status: 503 });
  }

  const cookie = request.cookies.get(AUTH_COOKIE)?.value || '';
  const expected = await sessionToken(password);
  if (cookie && safeEqual(cookie, expected)) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ success: false, error: 'Not logged in' }, { status: 401 });
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Skip Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
