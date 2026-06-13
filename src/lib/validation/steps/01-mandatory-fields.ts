import { IFnolExtractedData } from '@/models/FnolIntake';
import { StepResult } from '../types';

const VALID_CLAIM_TYPES = [
  'OWN_DAMAGE', 'THIRD_PARTY', 'THEFT', 'MEDICAL',
  'FIRE', 'PROPERTY_DAMAGE', 'NATURAL_DISASTER',
] as const;

const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;

export function validateMandatoryFields(data: IFnolExtractedData): StepResult {
  const errors: StepResult['errors'] = [];
  const warnings: StepResult['warnings'] = [];

  if (!data.policyNumber?.trim()) {
    errors.push({ field: 'policyNumber', message: 'Policy Number is required', code: 'REQUIRED' });
  }

  if (!data.insuredName?.trim()) {
    errors.push({ field: 'insuredName', message: 'Insured Name is required', code: 'REQUIRED' });
  }

  if (!data.dateOfLoss) {
    errors.push({ field: 'dateOfLoss', message: 'Date of Loss is required', code: 'REQUIRED' });
  } else {
    const dol = new Date(data.dateOfLoss);
    if (isNaN(dol.getTime())) {
      errors.push({ field: 'dateOfLoss', message: 'Date of Loss is not a valid date', code: 'INVALID_FORMAT' });
    } else if (dol > new Date()) {
      errors.push({ field: 'dateOfLoss', message: 'Date of Loss cannot be in the future', code: 'FUTURE_DATE' });
    }
  }

  if (!data.lossDescription?.trim()) {
    errors.push({ field: 'lossDescription', message: 'Loss Description is required', code: 'REQUIRED' });
  } else if (data.lossDescription.trim().length < 10) {
    errors.push({ field: 'lossDescription', message: 'Loss Description must be at least 10 characters', code: 'TOO_SHORT' });
  }

  if (!data.claimType) {
    errors.push({ field: 'claimType', message: 'Claim Type is required', code: 'REQUIRED' });
  } else if (!VALID_CLAIM_TYPES.includes(data.claimType as typeof VALID_CLAIM_TYPES[number])) {
    errors.push({
      field: 'claimType',
      message: `Claim Type must be one of: ${VALID_CLAIM_TYPES.join(', ')}`,
      code: 'INVALID_VALUE',
    });
  }

  if (!data.contactNumber?.trim()) {
    errors.push({ field: 'contactNumber', message: 'Contact Number is required', code: 'REQUIRED' });
  } else if (!INDIAN_MOBILE_RE.test(data.contactNumber.replace(/\s|-/g, ''))) {
    warnings.push({ field: 'contactNumber', message: 'Contact Number does not match expected 10-digit Indian mobile format' });
  }

  if (!data.claimAmount || data.claimAmount <= 0) {
    warnings.push({ field: 'claimAmount', message: 'Claim Amount not provided or zero; will default to 0' });
  }

  return { passed: errors.length === 0, errors, warnings };
}
