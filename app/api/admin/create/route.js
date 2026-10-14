import { NextResponse } from 'next/server';
import { hashPassword, signToken } from '@/lib/auth';
import { createAdminUser, findAdminByEmail } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, email, password, role = 'Admin', autoLogin = true } = body;

    // 1. Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter a valid full name (minimum 2 characters).' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // 2. Check if already exists
    const existing = await findAdminByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json({ error: 'An administrator account with this email already exists.' }, { status: 409 });
    }

    // 3. Hash password and insert
    const passwordHash = hashPassword(password);
    const newAdmin = await createAdminUser({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: role.trim() || 'Admin',
    });

    // 4. Generate login session token if requested
    let token = null;
    let response = null;

    if (autoLogin) {
      token = signToken({
        sub: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
        exp: Math.floor(Date.now() / 1000) + 28800,
      });

      response = NextResponse.json({
        ok: true,
        message: 'Admin account created successfully.',
        admin: newAdmin,
        token,
      }, { status: 201 });

      response.cookies.set('sts_admin', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 28800,
      });
    } else {
      response = NextResponse.json({
        ok: true,
        message: 'Admin account created successfully.',
        admin: newAdmin,
      }, { status: 201 });
    }

    return response;
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json({ error: error.message || 'Failed to create admin user.' }, { status: 500 });
  }
}
