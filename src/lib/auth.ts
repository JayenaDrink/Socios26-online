// Shared-password access for the whole app.
// The session cookie holds a SHA-256 hash derived from APP_PASSWORD, so changing
// the password in the environment logs everyone out.

export const AUTH_COOKIE = 'socios_session';
export const AUTH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function getAppPassword(): string | undefined {
  const p = process.env.APP_PASSWORD;
  return p && p.trim() !== '' ? p : undefined;
}

export async function sessionToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`socios-belgas:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time string comparison
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
