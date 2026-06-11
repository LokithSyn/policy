import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { findByPolicyNumber } from '@/lib/repository/policy.repository';
import { findByPolicyId } from '@/lib/repository/claims.repository';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(
  _request: NextRequest,
  { params }: { params: { policyNumber: string } }
) {
  try {
    await connectDB();

    const policy = await findByPolicyNumber(params.policyNumber);
    if (!policy) {
      return NextResponse.json(
        errorResponse('Policy not found'),
        { status: 404 }
      );
    }

    const claims = await findByPolicyId(policy.policyId);

    return NextResponse.json(
      successResponse({
        policyId: policy.policyId,
        policyNumber: policy.policyNumber,
        claimCount: claims.length,
        claims: claims.map((c) => ({
          claimId: c.claimId,
          claimNumber: c.claimNumber,
          incidentDate: c.incidentDate,
          claimAmount: c.claimAmount,
          approvedAmount: c.approvedAmount,
          claimStatus: c.claimStatus,
          claimType: c.claimType,
        })),
      })
    );
  } catch (error) {
    console.error('Error fetching claims:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
