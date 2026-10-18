import { NextResponse } from 'next/server';
import { recordQrScan } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id ? String(body.id).trim() : null;
    const candidate_id = body.candidate_id ? String(body.candidate_id).trim() : null;

    if (!id && !candidate_id) {
      return NextResponse.json(
        { error: 'Candidate ID or Registration ID is required.' },
        { status: 400 }
      );
    }

    const latitude = body.latitude !== undefined && body.latitude !== null ? Number(body.latitude) : null;
    const longitude = body.longitude !== undefined && body.longitude !== null ? Number(body.longitude) : null;
    const accuracy = body.accuracy !== undefined && body.accuracy !== null ? Number(body.accuracy) : null;

    // Extract client IP and User Agent
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip_address = (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || '127.0.0.1';
    const user_agent = request.headers.get('user-agent') || '';

    const updated = await recordQrScan({
      id,
      candidate_id,
      latitude,
      longitude,
      accuracy,
      user_agent,
      ip_address,
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Candidate record not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message: 'Scan entry recorded successfully with timestamp and geolocation coordinates.',
        candidate: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Record scan API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record QR scan.' },
      { status: 500 }
    );
  }
}
