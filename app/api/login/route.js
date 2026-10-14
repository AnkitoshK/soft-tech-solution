import { NextResponse } from 'next/server';
import { getEnv, signToken, verifyAdminRequest, verifyPassword } from '@/lib/auth';
import { findAdminByEmail, getAdminUsers } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  const admin = verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  return NextResponse.json({ 
    authenticated: true, 
    email: admin.sub,
    name: admin.name || 'Admin',
    role: admin.role || 'Admin',
  }, { status: 200 });
}

export async function POST(request) {
  try {
    const { email, password } = await request.json().catch(() => ({}));
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const expectedMasterEmail = getEnv('ADMIN_EMAIL', 'admin@softtechsolution.com').toLowerCase();
    const expectedMasterPassword = getEnv('ADMIN_PASSWORD', 'admin123');

    let authenticatedUser = null;

    // 1. Check database admin users
    try {
      const dbUser = await findAdminByEmail(normalizedEmail);
      if (dbUser && dbUser.password_hash) {
        if (verifyPassword(password, dbUser.password_hash)) {
          authenticatedUser = dbUser;
        }
      }
    } catch (e) {
      console.warn('DB admin check error:', e);
    }

    // 2. Check master env credentials fallback if not yet matched (only if master still exists or 0 admins exist)
    if (!authenticatedUser && normalizedEmail === expectedMasterEmail && password === expectedMasterPassword) {
      const allAdmins = await getAdminUsers();
      const masterStillExists = allAdmins.some(a => a.email.toLowerCase() === expectedMasterEmail || a.id === 'master_admin');
      if (allAdmins.length === 0 || masterStillExists) {
        authenticatedUser = {
          name: 'Master Administrator',
          email: expectedMasterEmail,
          role: 'Super Admin',
          isMaster: true,
        };
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = signToken({
      sub: authenticatedUser.email,
      name: authenticatedUser.name,
      role: authenticatedUser.role || 'Admin',
      exp: Math.floor(Date.now() / 1000) + 28800, // 8 hours
    });

    const response = NextResponse.json({ 
      ok: true, 
      email: authenticatedUser.email, 
      name: authenticatedUser.name,
      role: authenticatedUser.role || 'Admin',
      token 
    }, { status: 200 });

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
