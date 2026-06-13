import { IFnolExtractedData, IValidationStepResult } from '@/models/FnolIntake';
import { StepResult } from './types';
import { validateMandatoryFields } from './steps/01-mandatory-fields';
import { verifyPolicy, PolicyStepResult } from './steps/02-policy-verification';
import { validateCoverage } from './steps/03-coverage-validation';
import { checkDuplicateClaim } from './steps/04-duplicate-claim';
import { validateBusinessRules } from './steps/05-business-rules';
import type { IPolicy } from '@/models/Policy';

export interface PipelineResult {
  passed: boolean;
  status: 'VALIDATED' | 'FAILED';
  steps: IValidationStepResult[];
  policy?: IPolicy;
  enrichedData: Record<string, unknown>;
  allErrors: Array<{ field: string; message: string; code?: string }>;
  allWarnings: Array<{ field: string; message: string }>;
}

async function runStep(
  stepNumber: number,
  name: string,
  fn: () => Promise<StepResult> | StepResult
): Promise<{ result: StepResult; record: IValidationStepResult }> {
  const start = Date.now();
  const result = await fn();
  const record: IValidationStepResult = {
    step: stepNumber,
    name,
    status: result.passed ? 'PASS' : 'FAIL',
    errors: result.errors,
    warnings: result.warnings,
    durationMs: Date.now() - start,
  };
  return { result, record };
}

export async function runFnolPipeline(extractedData: IFnolExtractedData): Promise<PipelineResult> {
  const steps: IValidationStepResult[] = [];
  let enrichedData: Record<string, unknown> = {};
  let policy: IPolicy | undefined;
  let overallPassed = true;

  function collect(record: IValidationStepResult, result: StepResult) {
    steps.push(record);
    if (!result.passed) overallPassed = false;
    if (result.data) enrichedData = { ...enrichedData, ...result.data };
  }

  // ── Step 1: Mandatory Field Validation ──────────────────────────────────────
  const s1 = await runStep(1, 'Mandatory Field Validation', () =>
    validateMandatoryFields(extractedData)
  );
  collect(s1.record, s1.result);

  if (!s1.result.passed) {
    // Cannot proceed: fields are missing
    return buildResult(false, steps, enrichedData, policy);
  }

  // ── Step 2: Policy Verification ─────────────────────────────────────────────
  const s2 = await runStep(2, 'Policy Verification', () =>
    verifyPolicy(extractedData.policyNumber)
  );
  policy = (s2.result as PolicyStepResult).policy;
  collect(s2.record, s2.result);

  if (!s2.result.passed) {
    // Cannot proceed without a valid policy
    return buildResult(false, steps, enrichedData, policy);
  }

  // ── Step 3: Coverage Validation ─────────────────────────────────────────────
  const s3 = await runStep(3, 'Coverage Validation', () =>
    validateCoverage(
      policy!,
      extractedData.claimType ?? '',
      new Date(extractedData.dateOfLoss),
      extractedData.vehicleNumber
    )
  );
  collect(s3.record, s3.result);

  // ── Step 4: Duplicate Claim Detection ────────────────────────────────────────
  const s4 = await runStep(4, 'Duplicate Claim Detection', () =>
    checkDuplicateClaim({
      policyId: policy!.policyId,
      vehicleNumber: extractedData.vehicleNumber,
      dateOfLoss: new Date(extractedData.dateOfLoss),
      claimType: extractedData.claimType ?? '',
    })
  );
  collect(s4.record, s4.result);

  // ── Step 5: Business Rule Validation ────────────────────────────────────────
  const s5 = await runStep(5, 'Business Rule Validation', () =>
    validateBusinessRules(extractedData, enrichedData)
  );
  collect(s5.record, s5.result);

  return buildResult(overallPassed, steps, enrichedData, policy);
}

function buildResult(
  passed: boolean,
  steps: IValidationStepResult[],
  enrichedData: Record<string, unknown>,
  policy?: IPolicy
): PipelineResult {
  return {
    passed,
    status: passed ? 'VALIDATED' : 'FAILED',
    steps,
    policy,
    enrichedData,
    allErrors: steps.flatMap(s => s.errors),
    allWarnings: steps.flatMap(s => s.warnings),
  };
}
