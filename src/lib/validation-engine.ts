import ValidationRule, { IValidationRule } from '@/models/ValidationRule';
import { findByPolicyNumber, findByCustomerId } from './repository/policy.repository';
import { countActiveCoveragesByPolicyId } from './repository/coverage.repository';
import InsuredAsset from '@/models/InsuredAsset';
import Customer from '@/models/Customer';

export interface ValidationContext {
  policyNumber: string;
  vehicleNumber?: string;
  claimAmount?: number;
  claimType?: string;
  incidentDate?: string;
}

export interface RuleViolation {
  ruleCode: string;
  ruleName: string;
  field: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export interface FnolValidationResult {
  valid: boolean;
  policyId?: string;
  policyStatus?: string;
  customerId?: string;
  customerName?: string;
  coverageAvailable: boolean;
  assetMatched: boolean;
  violations: RuleViolation[];
  warnings: RuleViolation[];
  details: Record<string, unknown>;
}

function evaluateRule(rule: IValidationRule, value: unknown): boolean {
  const strValue = String(value ?? '');
  const ruleVal = rule.value ?? '';

  switch (rule.operator) {
    case 'EQUALS':
      return strValue === ruleVal;
    case 'NOT_EQUALS':
      return strValue !== ruleVal;
    case 'GREATER_THAN':
      return Number(value) > Number(ruleVal);
    case 'LESS_THAN':
      return Number(value) < Number(ruleVal);
    case 'IN':
      return ruleVal.split(',').map(v => v.trim()).includes(strValue);
    case 'NOT_IN':
      return !ruleVal.split(',').map(v => v.trim()).includes(strValue);
    case 'IS_NULL':
      return value === null || value === undefined || strValue === '';
    case 'IS_NOT_NULL':
      return value !== null && value !== undefined && strValue !== '';
    case 'REGEX':
      return new RegExp(ruleVal).test(strValue);
    default:
      return true;
  }
}

function resolveField(field: string, context: Record<string, unknown>): unknown {
  return field.split('.').reduce((obj: unknown, key) => {
    if (obj && typeof obj === 'object') {
      return (obj as Record<string, unknown>)[key];
    }
    return undefined;
  }, context);
}

export async function validateFnol(input: ValidationContext): Promise<FnolValidationResult> {
  const violations: RuleViolation[] = [];
  const warnings: RuleViolation[] = [];

  const policy = await findByPolicyNumber(input.policyNumber);
  if (!policy) {
    return {
      valid: false,
      coverageAvailable: false,
      assetMatched: false,
      violations: [{
        ruleCode: 'POLICY_NOT_FOUND',
        ruleName: 'Policy Exists',
        field: 'policyNumber',
        message: `Policy ${input.policyNumber} not found`,
        severity: 'ERROR',
      }],
      warnings: [],
      details: {},
    };
  }

  const customerData = await findByCustomerId(policy.customerId);
  const customer = customerData
    ? await Customer.findOne({ customerId: policy.customerId })
    : null;
  const customerName = customer
    ? `${customer.firstName} ${customer.lastName}`
    : 'Unknown';

  const now = new Date();
  const coverageCount = await countActiveCoveragesByPolicyId(policy.policyId);

  let assetMatched = true;
  if (input.vehicleNumber) {
    const asset = await InsuredAsset.findOne({
      policyId: policy.policyId,
      registrationNumber: input.vehicleNumber,
    });
    assetMatched = !!asset;
  }

  // Build evaluation context for rule engine
  const evalContext: Record<string, unknown> = {
    policyStatus: policy.policyStatus,
    policyExpired: policy.expiryDate < now,
    coverageCount,
    assetMatched,
    customerStatus: customer ? 'ACTIVE' : 'NOT_FOUND',
    claimType: input.claimType,
    claimAmount: input.claimAmount ?? 0,
  };

  const rules = await ValidationRule.find({ isActive: true, category: 'FNOL' })
    .sort({ priority: 1 });

  for (const rule of rules) {
    const fieldValue = resolveField(rule.field, evalContext);
    const passes = evaluateRule(rule, fieldValue);

    if (!passes) {
      const violation: RuleViolation = {
        ruleCode: rule.ruleCode,
        ruleName: rule.ruleName,
        field: rule.field,
        message: rule.errorMessage,
        severity: rule.severity,
      };
      if (rule.severity === 'ERROR') {
        violations.push(violation);
      } else {
        warnings.push(violation);
      }
    }
  }

  // Inline hard-guards that cannot be in the rule engine (pure structural checks)
  if (policy.policyStatus !== 'ACTIVE') {
    violations.push({
      ruleCode: 'POLICY_INACTIVE',
      ruleName: 'Policy Active',
      field: 'policyStatus',
      message: `Policy is ${policy.policyStatus}`,
      severity: 'ERROR',
    });
  }

  if (policy.expiryDate < now) {
    violations.push({
      ruleCode: 'POLICY_EXPIRED',
      ruleName: 'Policy Not Expired',
      field: 'expiryDate',
      message: 'Policy has expired',
      severity: 'ERROR',
    });
  }

  if (coverageCount === 0) {
    violations.push({
      ruleCode: 'NO_COVERAGE',
      ruleName: 'Coverage Available',
      field: 'coverageCount',
      message: 'No active coverage found for this policy',
      severity: 'ERROR',
    });
  }

  if (input.vehicleNumber && !assetMatched) {
    violations.push({
      ruleCode: 'ASSET_MISMATCH',
      ruleName: 'Asset Matches Policy',
      field: 'vehicleNumber',
      message: `Vehicle ${input.vehicleNumber} is not registered under policy ${input.policyNumber}`,
      severity: 'ERROR',
    });
  }

  const valid = violations.length === 0;

  return {
    valid,
    policyId: policy.policyId,
    policyStatus: policy.policyStatus,
    customerId: policy.customerId,
    customerName,
    coverageAvailable: coverageCount > 0,
    assetMatched,
    violations,
    warnings,
    details: {
      policyNumber: policy.policyNumber,
      policyType: policy.policyType,
      sumInsured: policy.sumInsured,
      expiryDate: policy.expiryDate,
      coverageCount,
    },
  };
}
