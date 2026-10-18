import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { 
  getCourseRegistrations, 
  updateCourseRegistration, 
  deleteCourseRegistration 
} from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function safe(v, max = 5000) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export async function GET(request) {
  try {
    const admin = verifyAdminRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'All';
    const courses = await getCourseRegistrations(status);
    return NextResponse.json(courses, { status: 200 });
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
      return NextResponse.json({ error: 'Missing candidate registration id' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const updates = {};
    if (body.payment_status) updates.payment_status = safe(body.payment_status, 40);
    if (body.notes !== undefined) updates.notes = safe(body.notes, 5000);
    if (body.amount !== undefined) updates.amount = safe(body.amount, 50);
    if (body.utr_number !== undefined) updates.utr_number = safe(body.utr_number, 100);
    if (body.receipt_number !== undefined) updates.receipt_number = safe(body.receipt_number, 100);
    if (body.receipt_data !== undefined) {
      updates.receipt_data = typeof body.receipt_data === 'object' ? JSON.stringify(body.receipt_data) : String(body.receipt_data);
    }
    if (body.paid_at !== undefined) updates.paid_at = safe(body.paid_at, 60);

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const updated = await updateCourseRegistration(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Candidate record not found or update failed.' }, { status: 404 });
    }
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
      return NextResponse.json({ error: 'Missing candidate registration id' }, { status: 400 });
    }

    const deleted = await deleteCourseRegistration(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Candidate record not found or delete failed.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
