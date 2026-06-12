import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db/mongodb';
import { transitionWorkflow } from '@/lib/workflow-engine';
import { findByClaimId } from '@/lib/repository/claims.repository';
import { successResponse, errorResponse } from '@/lib/api-response';

const transitionSchema = z.object({
  claimId: z.string().min(1),
  toStatus: z.string().min(1),
  performedBy: z.string().optional(),
  comment: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const input = transitionSchema.parse(body);

    const claim = await findByClaimId(input.claimId);
    if (!claim) {
      return NextResponse.json(errorResponse(`Claim ${input.claimId} not found`), { status: 404 });
    }

    const result = await transitionWorkflow({
      entityType: 'ClaimsHistory',
      entityId: input.claimId,
      workflowCode: 'CLAIM_WORKFLOW',
      fromStatus: claim.workflowStatus,
      toStatus: input.toStatus,
      performedBy: input.performedBy ?? 'SYSTEM',
      comment: input.comment,
    });

    if (!result.success) {
      return NextResponse.json(errorResponse(result.error ?? 'Transition failed'), { status: 422 });
    }

    return NextResponse.json(
      successResponse(
        {
          claimId: input.claimId,
          fromStatus: claim.workflowStatus,
          toStatus: input.toStatus,
          historyId: result.historyId,
        },
        'Workflow transition completed'
      )
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse(error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')),
        { status: 400 }
      );
    }
    console.error('Workflow transition error:', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
