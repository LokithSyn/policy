import { findByPolicyNumber } from '@/lib/repository/policy.repository';
import { StepResult } from '../types';
import type { IPolicy } from '@/models/Policy';

export interface PolicyStepResult extends StepResult {
  policy?: IPolicy;
}

export async function verifyPolicy(policyNumber: string): Promise<PolicyStepResult> {
  const errors: StepResult['errors'] = [];
  const warnings: StepResult['warnings'] = [];

  const policy = await findByPolicyNumber(policyNumber);

  if (!policy) {
    return {
      passed: false,
      errors: [{ field: 'policyNumber', message: `Policy '${policyNumber}' does not exist in the system`, code: 'POLICY_NOT_FOUND' }],
      warnings: [],
    };
  }

  const now = new Date();

  switch (policy.policyStatus) {
    case 'CANCELLED':
      errors.push({ field: 'policyStatus', message: 'Policy has been cancelled and is not eligible for claims', code: 'POLICY_CANCELLED' });
      break;
    case 'SUSPENDED':
      errors.push({ field: 'policyStatus', message: 'Policy is currently suspended', code: 'POLICY_SUSPENDED' });
      break;
    case 'EXPIRED':
      errors.push({ field: 'policyStatus', message: 'Policy has expired', code: 'POLICY_EXPIRED' });
      break;
    case 'ACTIVE':
      break;
    default:
      errors.push({ field: 'policyStatus', message: `Policy status '${policy.policyStatus}' is not eligible for claims`, code: 'POLICY_NOT_ACTIVE' });
  }

  if (policy.expiryDate < now) {
    errors.push({
      field: 'expiryDate',
      message: `Policy expired on ${new Date(policy.expiryDate).toDateString()}`,
      code: 'POLICY_EXPIRED_DATE',
    });
  }

  if (policy.effectiveDate > now) {
    errors.push({
      field: 'effectiveDate',
      message: `Policy is not yet effective until ${new Date(policy.effectiveDate).toDateString()}`,
      code: 'POLICY_NOT_EFFECTIVE',
    });
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    policy: policy as unknown as IPolicy,
    data: {
      policyId: policy.policyId,
      policyType: policy.policyType,
      policyStatus: policy.policyStatus,
      sumInsured: policy.sumInsured,
      insurerName: policy.insurerName,
      customerId: policy.customerId,
      effectiveDate: policy.effectiveDate,
      expiryDate: policy.expiryDate,
    },
  };
}
