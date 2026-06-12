import ClaimsHistory from '@/models/Claim';
import ClaimTimeline from '@/models/ClaimTimeline';
import AuditLog from '@/models/AuditLog';
import { FnolValidationResult } from './validation-engine';
import { FraudCheckResult } from './fraud-detection';

function generateClaimNumber(): string {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  return `CLM-${year}-${rand}`;
}

function generateId(prefix: string): string {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  return `${prefix}-${year}-${rand}`;
}

export interface ClaimRegistrationInput {
  fnolId?: string;
  fnolNumber?: string;
  policyId: string;
  claimType: string;
  incidentDate: Date;
  vehicleNumber?: string;
  description?: string;
  incidentLocation?: string;
  claimAmount: number;
  validation: FnolValidationResult;
  fraud: FraudCheckResult;
  registeredBy?: string;
}

export interface ClaimRegistrationResult {
  success: boolean;
  claimId?: string;
  claimNumber?: string;
  workflowStatus?: string;
  error?: string;
}

export async function registerClaim(
  input: ClaimRegistrationInput
): Promise<ClaimRegistrationResult> {
  const existing = input.fnolId
    ? await ClaimsHistory.findOne({ fnolId: input.fnolId })
    : null;

  if (existing) {
    return {
      success: false,
      error: `A claim already exists for FNOL ${input.fnolId}: ${existing.claimNumber}`,
    };
  }

  const claimId = generateId('CLM');
  const claimNumber = generateClaimNumber();

  const claimType = input.claimType as
    | 'OWN_DAMAGE'
    | 'THIRD_PARTY'
    | 'THEFT'
    | 'MEDICAL'
    | 'FIRE'
    | 'PROPERTY_DAMAGE'
    | 'NATURAL_DISASTER';

  await ClaimsHistory.create({
    claimId,
    claimNumber,
    policyId: input.policyId,
    fnolId: input.fnolId,
    fnolNumber: input.fnolNumber,
    claimType,
    incidentDate: input.incidentDate,
    claimAmount: input.claimAmount,
    approvedAmount: 0,
    claimStatus: 'PENDING',
    workflowStatus: 'CLAIM_REGISTERED',
    vehicleNumber: input.vehicleNumber,
    description: input.description,
    incidentLocation: input.incidentLocation,
    fraudFlags: input.fraud.flags,
    isFraudulent: input.fraud.isFraudulent,
    assignedTo: input.registeredBy,
  });

  // Create timeline entry
  const timelineId = generateId('TML');
  await ClaimTimeline.create({
    timelineId,
    claimId,
    eventType: 'CLAIM_REGISTERED',
    fromStatus: null,
    toStatus: 'CLAIM_REGISTERED',
    description: `Claim registered${input.fnolId ? ` from FNOL ${input.fnolId}` : ''}`,
    performedBy: input.registeredBy || 'SYSTEM',
    performedAt: new Date(),
    metadata: {
      fnolId: input.fnolId,
      policyId: input.policyId,
      fraudFlags: input.fraud.flags,
    },
  });

  // Audit log
  await AuditLog.create({
    userId: input.registeredBy || 'SYSTEM',
    action: 'CLAIM_REGISTERED',
    entity: 'ClaimsHistory',
    entityId: claimId,
    newValue: {
      claimNumber,
      policyId: input.policyId,
      fnolId: input.fnolId,
      claimType,
      workflowStatus: 'CLAIM_REGISTERED',
    },
    timestamp: new Date(),
  });

  if (input.fraud.isFraudulent) {
    const fraudTimelineId = generateId('TML');
    await ClaimTimeline.create({
      timelineId: fraudTimelineId,
      claimId,
      eventType: 'FRAUD_FLAG',
      description: `Fraud flags raised: ${input.fraud.flags.join(', ')}`,
      performedBy: 'SYSTEM',
      performedAt: new Date(),
      metadata: { fraudDetails: input.fraud.details },
    });
  }

  return {
    success: true,
    claimId,
    claimNumber,
    workflowStatus: 'CLAIM_REGISTERED',
  };
}
