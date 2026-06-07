import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Policy from '@/models/Policy';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(
  _request: NextRequest,
  { params }: { params: { policyNumber: string } }
) {
  try {
    await connectDB();

    const policy = await Policy.findOne({
      policyNumber: params.policyNumber,
    });

    if (!policy) {
      return NextResponse.json(
        errorResponse('Policy not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({
        policyNumber: policy.policyNumber,
        memberName: policy.memberName,
        memberId: policy.memberId,
        dob: policy.dob,
        policyType: policy.policyType,
        sumInsured: policy.sumInsured,
        deductible: policy.deductible,
        coPay: policy.coPay,
        status: policy.status,
        startDate: policy.startDate,
        endDate: policy.endDate,
        eligible: policy.status === 'Active',
      })
    );
  } catch (error) {
    console.error('Error fetching policy:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
