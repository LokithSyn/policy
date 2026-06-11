import { findByPolicyNumber, findByCustomerId } from './repository/policy.repository';
import { countActiveCoveragesByPolicyId } from './repository/coverage.repository';
import { countRecentClaims } from './repository/claims.repository';

export interface ValidationResult {
  valid: boolean;
  policyStatus: string;
  customerName?: string;
  coverageAvailable: boolean;
  claimCount: number;
  fraudAlert: boolean;
  rejectionReason?: string;
  approvedAmount?: number;
}

export async function validateClaim(
  policyNumber: string,
  claimAmount: number
): Promise<ValidationResult> {
  const policy = await findByPolicyNumber(policyNumber);

  if (!policy) {
    return {
      valid: false,
      policyStatus: 'NOT_FOUND',
      coverageAvailable: false,
      claimCount: 0,
      fraudAlert: false,
      rejectionReason: 'Policy not found',
    };
  }

  const customerResult = await findByCustomerId(policy.customerId);
  const customerName = customerResult
    ? `${customerResult[0]?.['firstName']} ${customerResult[0]?.['lastName']}`
    : 'Unknown';

  if (policy.policyStatus !== 'ACTIVE') {
    return {
      valid: false,
      policyStatus: policy.policyStatus,
      customerName,
      coverageAvailable: false,
      claimCount: 0,
      fraudAlert: false,
      rejectionReason: `Policy is ${policy.policyStatus}`,
    };
  }

  const now = new Date();
  if (policy.expiryDate < now) {
    return {
      valid: false,
      policyStatus: policy.policyStatus,
      customerName,
      coverageAvailable: false,
      claimCount: 0,
      fraudAlert: false,
      rejectionReason: 'Policy has expired',
    };
  }

  const coverageCount = await countActiveCoveragesByPolicyId(policy.policyId);
  if (coverageCount === 0) {
    return {
      valid: false,
      policyStatus: policy.policyStatus,
      customerName,
      coverageAvailable: false,
      claimCount: 0,
      fraudAlert: false,
      rejectionReason: 'No active coverage found',
    };
  }

  const recentClaimCount = await countRecentClaims(policy.policyId, 12);
  const fraudAlert = recentClaimCount > 3;

  const approvedAmount = claimAmount >= 0 ? claimAmount : 0;

  return {
    valid: true,
    policyStatus: policy.policyStatus,
    customerName,
    coverageAvailable: true,
    claimCount: recentClaimCount,
    fraudAlert,
    approvedAmount,
  };
}
