import { NextResponse } from 'next/server';
import { getDatabaseInfo } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const info = getDatabaseInfo();
  return NextResponse.json({
    ...info,
    timestamp: new Date().toISOString(),
  });
}
