import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, AUTH_MAX_AGE, getAppPassword, sessionToken, safeEqual } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const appPassword = getAppPassword();
  if (!appPassword) {
    return NextResponse.json({ success: false, error: 'APP_PASSWORD is not configured' }, { status: 503 });
  }

  let password = '';
  try {
    ({ password = '' } = await request.json());
  } catch {
    // ignore malformed body
  }

  const [given, expected] = await Promise.all([sessionToken(String(password)), sessionToken(appPassword)]);

  if (!safeEqual(given, expected)) {
    // Slow down guessing
    await new Promise(r => setTimeout(r, 1000));
    return NextResponse.json({ success: false, error: 'Wrong password' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_MAX_AGE,
  });
  return response;
}
