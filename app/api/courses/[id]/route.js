import { NextResponse } from 'next/server';
import { getCourseRegistrationById, updateCourseRegistration } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request, context) {
  try {
    const params = await context.params;
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing candidate id' }, { status: 400 });
    }

    const candidate = await getCourseRegistrationById(id);
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    return NextResponse.json(candidate, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request, context) {
  try {
    const params = await context.params;
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing candidate id' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const updates = {};
    if (body.payment_status) updates.payment_status = String(body.payment_status);
    if (body.notes !== undefined) updates.notes = String(body.notes);

    const updated = await updateCourseRegistration(id, updates);
    return NextResponse.json({ ok: true, candidate: updated || null }, { status: 200 });
  } catch (error) {
    console.error('Update candidate error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
