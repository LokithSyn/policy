import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Policy from '@/models/Policy';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const policyNumber = request.headers.get('x-policy-number');

    if (!policyNumber) {
      return NextResponse.json({ valid: false, error: 'Policy number header (x-policy-number) is required' }, { status: 400 });
    }

    const policy = await Policy.findOne({ policyNumber: policyNumber.trim() });

    return NextResponse.json({
      valid: !!policy,
      policyNumber,
    });
  } catch (error) {
    console.error('Error validating policy:', error);
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const policyNumber = request.headers.get('x-policy-number');

    if (!policyNumber) {
      return NextResponse.json({ valid: false, error: 'Policy number header (x-policy-number) is required' }, { status: 400 });
    }

    const policy = await Policy.findOne({ policyNumber: policyNumber.trim() });

    return NextResponse.json({
      valid: !!policy,
      policyNumber,
    });
  } catch (error) {
    console.error('Error validating policy:', error);
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 });
  }
}
