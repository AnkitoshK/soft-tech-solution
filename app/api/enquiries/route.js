import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { createEnquiry, getEnquiries, updateEnquiry, deleteEnquiry } from '@/lib/db';

function safe(v, max = 5000) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = safe(body.name, 120);
    const email = safe(body.email, 180);
    const phone = safe(body.phone, 40);
    const service = safe(body.service, 120);
    const message = safe(body.message, 5000);

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 });
    }

    const saved = await createEnquiry({ name, email, phone, service, message });
    return NextResponse.json({ ok: true, id: saved?.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not save enquiry.' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const admin = verifyAdminRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'All';
    const leads = await getEnquiries(status);
    return NextResponse.json(leads, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const admin = verifyAdminRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing enquiry id' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const updates = {};
    if (body.status) updates.status = safe(body.status, 30);
    if (body.notes !== undefined) updates.notes = safe(body.notes, 5000);

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const updated = await updateEnquiry(id, updates);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const admin = verifyAdminRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing enquiry id' }, { status: 400 });
    }

    await deleteEnquiry(id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
