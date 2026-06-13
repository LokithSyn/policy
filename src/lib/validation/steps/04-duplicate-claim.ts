import ClaimsHistory from '@/models/Claim';
import { StepResult } from '../types';

interface DuplicateCheckInput {
  policyId: string;
  vehicleNumber?: string;
  dateOfLoss: Date;
  claimType: string;
}

export async function checkDuplicateClaim(input: DuplicateCheckInput): Promise<StepResult> {
  const { policyId, vehicleNumber, dateOfLoss, claimType } = input;

  // Match on the same calendar day as date of loss
  const dolStart = new Date(dateOfLoss);
  dolStart.setHours(0, 0, 0, 0);
  const dolEnd = new Date(dateOfLoss);
  dolEnd.setHours(23, 59, 59, 999);

  const query: Record<string, unknown> = {
    policyId,
    claimType,
    incidentDate: { $gte: dolStart, $lte: dolEnd },
    claimStatus: { $nin: ['REJECTED'] },
  };

  if (vehicleNumber) {
    query.vehicleNumber = vehicleNumber;
  }

  const existing = await ClaimsHistory.findOne(query).select('claimId claimNumber claimStatus workflowStatus');

  if (existing) {
    return {
      passed: false,
      errors: [
        {
          field: 'duplicate',
          message: `Duplicate claim detected. Claim '${existing.claimNumber}' (${existing.claimStatus}) already exists `
            + `for the same policy, vehicle, date of loss, and claim type.`,
          code: 'DUPLICATE_CLAIM',
        },
      ],
      warnings: [],
      data: {
        existingClaimId: existing.claimId,
        existingClaimNumber: existing.claimNumber,
        existingStatus: existing.claimStatus,
      },
    };
  }

  return { passed: true, errors: [], warnings: [] };
}
