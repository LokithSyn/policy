import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    message: 'Health check passed',
    timestamp: new Date().toISOString(),
  });
}
