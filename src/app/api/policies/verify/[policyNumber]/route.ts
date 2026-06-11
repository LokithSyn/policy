import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { validateClaim } from '@/lib/claims-validator';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(
  _request: NextRequest,
  { params }: { params: { policyNumber: string } }
) {
  try {
    await connectDB();

    const result = await validateClaim(params.policyNumber, 0);

    return NextResponse.json(
      successResponse({
        valid: result.valid,
        policyStatus: result.policyStatus,
        customerName: result.customerName,
        coverageAvailable: result.coverageAvailable,
        claimCount: result.claimCount,
        fraudAlert: result.fraudAlert,
        rejectionReason: result.rejectionReason,
      })
    );
  } catch (error) {
    console.error('Error verifying policy:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
