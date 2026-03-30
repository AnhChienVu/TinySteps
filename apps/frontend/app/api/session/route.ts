import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  AUTH_SESSION_COOKIE,
  authSessionCookieOptions,
} from '@/lib/auth/session';

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_SESSION_COOKIE, 'authenticated', authSessionCookieOptions);

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();

  cookieStore.delete(AUTH_SESSION_COOKIE);

  return NextResponse.json({ ok: true });
}
