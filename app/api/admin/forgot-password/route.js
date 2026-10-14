import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { findAdminByEmail, updateAdminPassword } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, newPassword, confirmPassword } = body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please provide a valid registered admin email address.' }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match. Please re-enter.' }, { status: 400 });
    }

    // Verify account existence
    const masterEmail = (process.env.ADMIN_EMAIL || 'admin@softtechsolution.com').toLowerCase();
    const existing = await findAdminByEmail(cleanEmail);

    if (!existing && cleanEmail !== masterEmail) {
      return NextResponse.json({ 
        error: 'No administrator account was found with this email address.' 
      }, { status: 404 });
    }

    // Update password
    const newHash = hashPassword(newPassword);
    const success = await updateAdminPassword(cleanEmail, newHash);

    if (!success) {
      return NextResponse.json({ error: 'Could not update password. Please try again later.' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Password reset successfully! You can now log in with your new credentials.',
    }, { status: 200 });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: error.message || 'Server error processing password reset.' }, { status: 500 });
  }
}
