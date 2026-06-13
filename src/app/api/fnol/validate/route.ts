/**
 * POST /api/fnol/validate
 *
 * Validation-only endpoint for external applications (e.g. IntelliDoc).
 * Runs the full 5-step validation pipeline and returns the result.
 * Does NOT create a claim. Does NOT store any record.
 * Safe to call multiple times with the same data.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db/mongodb';
import { runFnolPipeline } from '@/lib/validation/fnol-pipeline';
import { runFraudChecks } from '@/lib/fraud-detection';
import { successResponse, errorResponse } from '@/lib/api-response';

const ValidateSchema = z.object({
  policyNumber:    z.string().min(1, 'policyNumber is required'),
  insuredName:     z.string().min(1, 'insuredName is required'),
  dateOfLoss:      z.string().min(1, 'dateOfLoss is required'),
  vehicleNumber:   z.string().optional(),
  lossDescription: z.string().min(1, 'lossDescription is required'),
  claimType:       z.string().optional(),
  contactNumber:   z.string().optional(),
  claimAmount:     z.number().optional(),
  incidentLocation: z.string().optional(),
  /** Set true to also run fraud detection as part of the validation response */
  includeFraudCheck: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(errorResponse('Request body is not valid JSON'), { status: 400 });
    }
    const parsed = ValidateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse(parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')),
        { status: 400 }
      );
    }

    const { includeFraudCheck, ...extractedData } = parsed.data;
    const dateOfLoss = new Date(extractedData.dateOfLoss);

    // Run the full 5-step pipeline (read-only — no DB writes)
    const pipeline = await runFnolPipeline({ ...extractedData, dateOfLoss });

    let fraud: {
      isFraudulent: boolean;
      severity: string;
      flags: string[];
      details: unknown[];
    } | null = null;

    if (includeFraudCheck && pipeline.passed && pipeline.policy) {
      const fraudResult = await runFraudChecks({
        policyId:     pipeline.policy.policyId,
        vehicleNumber: extractedData.vehicleNumber,
        incidentDate: dateOfLoss,
        claimAmount:  extractedData.claimAmount,
        claimType:    extractedData.claimType,
      });
      fraud = {
        isFraudulent: fraudResult.isFraudulent,
        severity:     fraudResult.severity,
        flags:        fraudResult.flags,
        details:      fraudResult.details,
      };
    }

    const statusCode = pipeline.passed ? 200 : 422;

    return NextResponse.json(
      successResponse({
        valid:   pipeline.passed,
        status:  pipeline.passed ? 'VALIDATED' : 'VALIDATION_FAILED',
        // Summary counts for quick inspection
        summary: {
          totalSteps:  pipeline.steps.length,
          passed:      pipeline.steps.filter(s => s.status === 'PASS').length,
          failed:      pipeline.steps.filter(s => s.status === 'FAIL').length,
          errorCount:  pipeline.allErrors.length,
          warningCount: pipeline.allWarnings.length,
        },
        // Per-step breakdown
        validationSteps: pipeline.steps.map(s => ({
          step:     s.step,
          name:     s.name,
          status:   s.status,
          errors:   s.errors,
          warnings: s.warnings,
          durationMs: s.durationMs,
        })),
        // Flat error/warning lists for easy consumption
        errors:   pipeline.allErrors,
        warnings: pipeline.allWarnings,
        // Policy context (when policy found)
        policyContext: pipeline.passed ? {
          policyId:      pipeline.enrichedData.policyId,
          policyType:    pipeline.enrichedData.policyType,
          policyStatus:  pipeline.enrichedData.policyStatus,
          sumInsured:    pipeline.enrichedData.sumInsured,
          customerId:    pipeline.enrichedData.customerId,
          coverageCodes: pipeline.enrichedData.coverageCodes,
        } : null,
        // Fraud check (only when includeFraudCheck=true and validation passed)
        fraud,
      }),
      { status: statusCode }
    );
  } catch (error) {
    console.error('[FNOL Validate] Unhandled error:', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
