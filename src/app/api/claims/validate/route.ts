import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Policy from '@/models/Policy';
import { errorResponse, successResponse } from '@/lib/api-response';
import { z } from 'zod';

const validateClaimSchema = z.object({
  policyNumber: z.string().min(1),
  claimNumber: z.string().min(1),
  claimAmount: z.number().positive(),
  hospitalName: z.string().min(1),
  admissionDate: z.string().datetime(),
  dischargeDate: z.string().datetime(),
});

export async function POST(_request: NextRequest) {
  try {
    await connectDB();

    const body = await _request.json();
    const validated = validateClaimSchema.parse(body);

    // Fetch policy
    const policy = await Policy.findOne({ policyNumber: validated.policyNumber });
    if (!policy) {
      return NextResponse.json(
        errorResponse('Policy not found'),
        { status: 404 }
      );
    }

    // Check eligibility
    const now = new Date();
    const isEligible =
      policy.status === 'Active' &&
      policy.startDate <= now &&
      policy.endDate >= now;

    let approvedAmount = 0;
    let validationStatus = 'REJECTED';

    if (isEligible && validated.claimAmount <= policy.sumInsured) {
      approvedAmount = validated.claimAmount - policy.deductible;
      approvedAmount = Math.max(0, approvedAmount);
      approvedAmount = approvedAmount * (1 - (policy.coPay / 100));
      validationStatus = 'APPROVED';
    }

    return NextResponse.json(
      successResponse({
        validationStatus,
        policyNumber: policy.policyNumber,
        claimNumber: validated.claimNumber,
        claimAmount: validated.claimAmount,
        approvedAmount: Math.round(approvedAmount),
        coverageAvailable: policy.sumInsured - validated.claimAmount,
        remainingBalance: Math.max(0, policy.sumInsured - validated.claimAmount),
        eligible: isEligible,
        remarks: isEligible
          ? `Claim approved. Approved amount after deductible and co-pay: ${Math.round(approvedAmount)}`
          : 'Policy not active or claim exceeds sum insured',
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse(error.errors[0].message),
        { status: 400 }
      );
    }
    console.error('Error validating claim:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
