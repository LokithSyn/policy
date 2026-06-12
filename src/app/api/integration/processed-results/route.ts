import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db/mongodb';
import { findByClaimId } from '@/lib/repository/claims.repository';
import { transitionWorkflow } from '@/lib/workflow-engine';
import ClaimTimeline from '@/models/ClaimTimeline';
import AuditLog from '@/models/AuditLog';
import ClaimsHistory from '@/models/Claim';
import { successResponse, errorResponse } from '@/lib/api-response';

const processedResultSchema = z.object({
  claimId: z.string().min(1),
  decision: z.enum(['APPROVED', 'REJECTED', 'PENDING_INFO']),
  approvedAmount: z.number().nonnegative().optional(),
  rejectionReason: z.string().optional(),
  processedBy: z.string().optional(),
  notes: z.string().optional(),
  settlementDetails: z
    .object({
      settlementAmount: z.number().nonnegative(),
      settlementMode: z.string(),
      bankAccount: z.string().optional(),
      remarks: z.string().optional(),
    })
    .optional(),
});

function generateId(prefix: string): string {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  return `${prefix}-${year}-${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const input = processedResultSchema.parse(body);

    const claim = await findByClaimId(input.claimId);
    if (!claim) {
      return NextResponse.json(errorResponse(`Claim ${input.claimId} not found`), { status: 404 });
    }

    const processedBy = input.processedBy ?? 'INTELLIDOC_INTEGRATION';
    const updateData: Record<string, unknown> = {
      notes: input.notes,
    };

    let toWorkflowStatus: string;

    if (input.decision === 'APPROVED') {
      toWorkflowStatus = 'APPROVED';
      updateData.approvedAmount = input.approvedAmount ?? claim.claimAmount;
      updateData.claimStatus = 'APPROVED';

      if (input.settlementDetails) {
        updateData.settlementDetails = {
          settlementAmount: input.settlementDetails.settlementAmount,
          settlementMode: input.settlementDetails.settlementMode,
          settlementDate: new Date(),
          bankAccount: input.settlementDetails.bankAccount,
          remarks: input.settlementDetails.remarks,
        };
      }
    } else if (input.decision === 'REJECTED') {
      toWorkflowStatus = 'REJECTED';
      updateData.claimStatus = 'REJECTED';
    } else {
      toWorkflowStatus = 'DOCUMENTS_PENDING';
    }

    await ClaimsHistory.findOneAndUpdate({ claimId: input.claimId }, updateData);

    // Workflow transition
    await transitionWorkflow({
      entityType: 'ClaimsHistory',
      entityId: input.claimId,
      workflowCode: 'CLAIM_WORKFLOW',
      fromStatus: claim.workflowStatus,
      toStatus: toWorkflowStatus,
      performedBy: processedBy,
      comment: input.rejectionReason || input.notes,
    });

    // Timeline
    const timelineId = generateId('TML');
    await ClaimTimeline.create({
      timelineId,
      claimId: input.claimId,
      eventType: `CLAIM_${input.decision}`,
      fromStatus: claim.workflowStatus,
      toStatus: toWorkflowStatus,
      description: input.rejectionReason || input.notes || `Claim ${input.decision.toLowerCase()} by ${processedBy}`,
      performedBy: processedBy,
      performedAt: new Date(),
      metadata: {
        approvedAmount: input.approvedAmount,
        rejectionReason: input.rejectionReason,
      },
    });

    await AuditLog.create({
      userId: processedBy,
      action: `CLAIM_${input.decision}`,
      entity: 'ClaimsHistory',
      entityId: input.claimId,
      oldValue: { workflowStatus: claim.workflowStatus, claimStatus: claim.claimStatus },
      newValue: { workflowStatus: toWorkflowStatus, decision: input.decision },
      timestamp: new Date(),
    });

    return NextResponse.json(
      successResponse(
        {
          claimId: input.claimId,
          claimNumber: claim.claimNumber,
          decision: input.decision,
          workflowStatus: toWorkflowStatus,
          approvedAmount: updateData.approvedAmount,
        },
        `Claim ${input.decision.toLowerCase()} successfully`
      )
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse(error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')),
        { status: 400 }
      );
    }
    console.error('Process results error:', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
