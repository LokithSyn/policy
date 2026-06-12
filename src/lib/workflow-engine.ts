import WorkflowDefinition from '@/models/WorkflowDefinition';
import WorkflowHistory from '@/models/WorkflowHistory';
import ClaimTimeline from '@/models/ClaimTimeline';
import ClaimsHistory from '@/models/Claim';

function generateId(prefix: string): string {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  return `${prefix}-${year}-${rand}`;
}

export interface TransitionRequest {
  entityType: string;
  entityId: string;
  workflowCode: string;
  fromStatus: string;
  toStatus: string;
  performedBy: string;
  comment?: string;
  metadata?: Record<string, unknown>;
}

export interface TransitionResult {
  success: boolean;
  historyId?: string;
  error?: string;
}

export async function transitionWorkflow(req: TransitionRequest): Promise<TransitionResult> {
  const definition = await WorkflowDefinition.findOne({
    workflowCode: req.workflowCode,
    isActive: true,
  });

  if (!definition) {
    return { success: false, error: `Workflow definition '${req.workflowCode}' not found` };
  }

  interface Transition { fromStatus: string; toStatus: string; }
  const transition = definition.transitions.find(
    (t: Transition) => t.fromStatus === req.fromStatus && t.toStatus === req.toStatus
  );

  if (!transition) {
    return {
      success: false,
      error: `Transition from '${req.fromStatus}' to '${req.toStatus}' is not allowed`,
    };
  }

  const historyId = generateId('WFH');
  await WorkflowHistory.create({
    historyId,
    entityType: req.entityType,
    entityId: req.entityId,
    workflowCode: req.workflowCode,
    fromStatus: req.fromStatus,
    toStatus: req.toStatus,
    transitionedBy: req.performedBy,
    transitionedAt: new Date(),
    comment: req.comment,
    metadata: req.metadata,
  });

  // Update the claim's workflowStatus if entity is a claim
  if (req.entityType === 'ClaimsHistory') {
    const claimUpdate: Record<string, unknown> = { workflowStatus: req.toStatus };

    // Keep claimStatus in sync with terminal statuses
    if (['APPROVED', 'REJECTED', 'SETTLED'].includes(req.toStatus)) {
      claimUpdate.claimStatus = req.toStatus as string;
    } else if (req.toStatus === 'UNDER_REVIEW') {
      claimUpdate.claimStatus = 'UNDER_REVIEW';
    }

    await ClaimsHistory.findOneAndUpdate({ claimId: req.entityId }, claimUpdate);
  }

  // Create timeline entry
  const timelineId = generateId('TML');
  await ClaimTimeline.create({
    timelineId,
    claimId: req.entityId,
    eventType: 'WORKFLOW_TRANSITION',
    fromStatus: req.fromStatus,
    toStatus: req.toStatus,
    description: req.comment || `Status changed from ${req.fromStatus} to ${req.toStatus}`,
    performedBy: req.performedBy,
    performedAt: new Date(),
    metadata: req.metadata,
  });

  return { success: true, historyId };
}

export async function getWorkflowHistory(entityId: string) {
  return WorkflowHistory.find({ entityId }).sort({ transitionedAt: -1 });
}

export async function canTransition(
  workflowCode: string,
  fromStatus: string,
  toStatus: string
): Promise<boolean> {
  const definition = await WorkflowDefinition.findOne({
    workflowCode,
    isActive: true,
  });
  if (!definition) return false;

  interface Transition { fromStatus: string; toStatus: string; }
  return definition.transitions.some(
    (t: Transition) => t.fromStatus === fromStatus && t.toStatus === toStatus
  );
}
