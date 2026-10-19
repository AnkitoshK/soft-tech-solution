import { NextResponse } from 'next/server';
import { getNextCandidateId } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const nextId = await getNextCandidateId();
    return NextResponse.json({ nextId }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ nextId: 'STS 001' }, { status: 200 });
  }
}
