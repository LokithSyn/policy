import ValidationRule from '@/models/ValidationRule';
import { IFnolExtractedData } from '@/models/FnolIntake';
import { StepResult } from '../types';

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current !== null && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function evaluateCondition(fieldValue: unknown, operator: string, ruleValue: string | undefined): boolean {
  const str = String(fieldValue ?? '');
  const num = Number(fieldValue);
  const ruleNum = Number(ruleValue ?? '0');

  switch (operator) {
    case 'EQUALS':      return str === (ruleValue ?? '');
    case 'NOT_EQUALS':  return str !== (ruleValue ?? '');
    case 'GREATER_THAN': return !isNaN(num) && num > ruleNum;
    case 'LESS_THAN':   return !isNaN(num) && num < ruleNum;
    case 'IN':          return (ruleValue ?? '').split(',').map(v => v.trim()).includes(str);
    case 'NOT_IN':      return !(ruleValue ?? '').split(',').map(v => v.trim()).includes(str);
    case 'IS_NULL':     return fieldValue == null || str === '';
    case 'IS_NOT_NULL': return fieldValue != null && str !== '';
    case 'REGEX':       try { return ruleValue ? new RegExp(ruleValue).test(str) : false; } catch { return false; }
    default:            return true;
  }
}

export async function validateBusinessRules(
  extractedData: IFnolExtractedData,
  enrichedData: Record<string, unknown> = {}
): Promise<StepResult> {
  const errors: StepResult['errors'] = [];
  const warnings: StepResult['warnings'] = [];

  const rules = await ValidationRule.find({
    isActive: true,
    category: { $in: ['FNOL', 'BUSINESS_RULE', 'CLAIM'] },
  }).sort({ priority: 1 });

  if (rules.length === 0) {
    return { passed: true, errors: [], warnings: [], data: { rulesEvaluated: 0 } };
  }

  const context: Record<string, unknown> = {
    policyNumber: extractedData.policyNumber,
    insuredName: extractedData.insuredName,
    lossDescription: extractedData.lossDescription,
    claimType: extractedData.claimType,
    contactNumber: extractedData.contactNumber,
    vehicleNumber: extractedData.vehicleNumber,
    claimAmount: extractedData.claimAmount ?? 0,
    incidentLocation: extractedData.incidentLocation,
    ...enrichedData,
  };

  for (const rule of rules) {
    const fieldValue = getNestedValue(context, rule.field);
    // Rules define VALID conditions — if condition does NOT hold, it's a violation
    const conditionHolds = evaluateCondition(fieldValue, rule.operator, rule.value);
    if (!conditionHolds) {
      const entry = { field: rule.field, message: rule.errorMessage, code: rule.ruleCode };
      if (rule.severity === 'ERROR') {
        errors.push(entry);
      } else {
        warnings.push({ field: rule.field, message: rule.errorMessage });
      }
    }
  }

  return { passed: errors.length === 0, errors, warnings, data: { rulesEvaluated: rules.length } };
}
