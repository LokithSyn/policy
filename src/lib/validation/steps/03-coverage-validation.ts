import { findActiveCoveragesByPolicyId } from '@/lib/repository/coverage.repository';
import InsuredAsset from '@/models/InsuredAsset';
import { StepResult } from '../types';
import type { IPolicy } from '@/models/Policy';

// Maps claim type to coverage codes that satisfy it
const COVERAGE_CODE_MAP: Record<string, string[]> = {
  OWN_DAMAGE: ['OWN_DAMAGE', 'COMPREHENSIVE', 'OD'],
  THIRD_PARTY: ['THIRD_PARTY', 'TP', 'LIABILITY'],
  THEFT: ['THEFT', 'COMPREHENSIVE', 'OD'],
  MEDICAL: ['MEDICAL', 'HEALTH', 'PERSONAL_ACCIDENT', 'PA'],
  FIRE: ['FIRE', 'COMPREHENSIVE', 'PROPERTY'],
  PROPERTY_DAMAGE: ['PROPERTY', 'PROPERTY_DAMAGE', 'COMPREHENSIVE'],
  NATURAL_DISASTER: ['NATURAL_DISASTER', 'ACT_OF_GOD', 'COMPREHENSIVE'],
};

export async function validateCoverage(
  policy: IPolicy,
  claimType: string,
  dateOfLoss: Date,
  vehicleNumber?: string
): Promise<StepResult> {
  const errors: StepResult['errors'] = [];
  const warnings: StepResult['warnings'] = [];

  const coverages = await findActiveCoveragesByPolicyId(policy.policyId);

  if (!coverages || coverages.length === 0) {
    return {
      passed: false,
      errors: [{ field: 'coverage', message: 'No active coverages found for this policy', code: 'NO_ACTIVE_COVERAGE' }],
      warnings: [],
    };
  }

  const dol = new Date(dateOfLoss);
  if (dol < new Date(policy.effectiveDate) || dol > new Date(policy.expiryDate)) {
    errors.push({
      field: 'dateOfLoss',
      message: `Date of loss (${dol.toDateString()}) is outside the policy coverage period `
        + `(${new Date(policy.effectiveDate).toDateString()} — ${new Date(policy.expiryDate).toDateString()})`,
      code: 'DATE_OUTSIDE_COVERAGE_PERIOD',
    });
  }

  const allowedCodes = COVERAGE_CODE_MAP[claimType] ?? [];
  const matchingCoverage = coverages.find(c =>
    allowedCodes.some(code => c.coverageCode.toUpperCase().includes(code))
  );

  if (!matchingCoverage && allowedCodes.length > 0) {
    warnings.push({
      field: 'claimType',
      message: `No explicit coverage found for claim type '${claimType}'. `
        + `Available coverage codes: ${coverages.map(c => c.coverageCode).join(', ')}`,
    });
  }

  // Vehicle / asset verification
  let assetMatched = true;
  if (vehicleNumber) {
    const asset = await InsuredAsset.findOne({
      policyId: policy.policyId,
      registrationNumber: vehicleNumber,
    });
    assetMatched = !!asset;
    if (!assetMatched) {
      errors.push({
        field: 'vehicleNumber',
        message: `Vehicle '${vehicleNumber}' is not registered under policy '${policy.policyNumber ?? policy.policyId}'`,
        code: 'ASSET_NOT_ON_POLICY',
      });
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    data: {
      activeCoverages: coverages.length,
      coverageCodes: coverages.map(c => c.coverageCode),
      matchedCoverageCode: matchingCoverage?.coverageCode,
      coverageLimit: matchingCoverage?.coverageLimit,
      deductible: matchingCoverage?.deductible,
      assetMatched,
    },
  };
}
