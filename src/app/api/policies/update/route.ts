import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Policy from '@/models/Policy';
import { errorResponse, successResponse } from '@/lib/api-response';
import { z } from 'zod';

const updatePolicySchema = z.object({
  policyNumber: z.string().min(1),
  policyStatus: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED']).optional(),
  sumInsured: z.number().positive().optional(),
  premiumAmount: z.number().positive().optional(),
  expiryDate: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validated = updatePolicySchema.parse(body);

    const policy = await Policy.findOne({ policyNumber: validated.policyNumber });
    if (!policy) {
      return NextResponse.json(
        errorResponse('Policy not found'),
        { status: 404 }
      );
    }

    // Update fields
    if (validated.policyStatus) policy.policyStatus = validated.policyStatus;
    if (validated.sumInsured) policy.sumInsured = validated.sumInsured;
    if (validated.premiumAmount) policy.premiumAmount = validated.premiumAmount;
    if (validated.expiryDate) policy.expiryDate = new Date(validated.expiryDate);

    await policy.save();

    return NextResponse.json(
      successResponse(policy, 'Policy updated successfully'),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse(error.errors[0].message),
        { status: 400 }
      );
    }
    console.error('Error updating policy:', error);
    const msg = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'Internal server error';
    return NextResponse.json(
      errorResponse(msg),
      { status: 500 }
    );
  }
}
