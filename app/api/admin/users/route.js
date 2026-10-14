import { NextResponse } from 'next/server';
import { verifyAdminRequest, hashPassword } from '@/lib/auth';
import { getAdminUsers, createAdminUser, updateAdminPassword, deleteAdminUser } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: List all admin accounts
export async function GET(request) {
  const currentAdmin = verifyAdminRequest(request);
  if (!currentAdmin) {
    return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const users = await getAdminUsers();
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to fetch admin users.' }, { status: 500 });
  }
}

// POST: Create a new admin account from dashboard
export async function POST(request) {
  const currentAdmin = verifyAdminRequest(request);
  if (!currentAdmin) {
    return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { name, email, password, role = 'Admin' } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    const newAdmin = await createAdminUser({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: role.trim() || 'Admin',
    });

    return NextResponse.json({
      ok: true,
      message: `Admin account for ${newAdmin.name} created successfully.`,
      admin: newAdmin,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to create admin user.' }, { status: 400 });
  }
}

// PATCH: Reset or change password of an admin user
export async function PATCH(request) {
  const currentAdmin = verifyAdminRequest(request);
  if (!currentAdmin) {
    return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { email, newPassword } = body;

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return NextResponse.json({ error: 'Admin email is required.' }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
    }

    const newHash = hashPassword(newPassword);
    const success = await updateAdminPassword(cleanEmail, newHash);

    if (!success) {
      return NextResponse.json({ error: 'Admin user not found or password update failed.' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      message: `Password updated successfully for ${cleanEmail}.`,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to update password.' }, { status: 500 });
  }
}

// DELETE: Remove an admin user
export async function DELETE(request) {
  const currentAdmin = verifyAdminRequest(request);
  if (!currentAdmin) {
    return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required.' }, { status: 400 });
    }

    if (id === 'master_admin') {
      return NextResponse.json({ error: 'The Master Administrator account cannot be deleted.' }, { status: 403 });
    }

    const success = await deleteAdminUser(id);
    if (!success) {
      return NextResponse.json({ error: 'Could not delete admin user.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: 'Admin account removed successfully.' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error deleting admin user.' }, { status: 500 });
  }
}
