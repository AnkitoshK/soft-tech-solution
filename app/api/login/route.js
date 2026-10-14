import { NextResponse } from 'next/server';
import { getEnv, signToken, verifyAdminRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  const admin = verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  return NextResponse.json({ authenticated: true, email: admin.sub }, { status: 200 });
}

export async function POST(request) {
  try {
    const { email, password } = await request.json().catch(() => ({}));
    const expectedEmail = getEnv('ADMIN_EMAIL', 'admin@softtechsolution.com');
    const expectedPassword = getEnv('ADMIN_PASSWORD', 'admin123');

    if (email !== expectedEmail || password !== expectedPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = signToken({
      sub: email,
      exp: Math.floor(Date.now() / 1000) + 28800, // 8 hours
    });

    const response = NextResponse.json({ ok: true, email, token }, { status: 200 });
    response.cookies.set('sts_admin', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 28800,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set('sts_admin', '', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  });
  return response;
}
