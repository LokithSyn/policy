import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { findByPolicyNumber } from '@/lib/repository/policy.repository';
import { findByPolicyId } from '@/lib/repository/coverage.repository';
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

    const coverages = await findByPolicyId(policy.policyId);

    return NextResponse.json(
      successResponse({
        policyId: policy.policyId,
        policyNumber: policy.policyNumber,
        coverages: coverages.map((c) => ({
          coverageId: c.coverageId,
          coverageCode: c.coverageCode,
          coverageName: c.coverageName,
          coverageLimit: c.coverageLimit,
          deductible: c.deductible,
          status: c.status,
        })),
      })
    );
  } catch (error) {
    console.error('Error fetching coverages:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
