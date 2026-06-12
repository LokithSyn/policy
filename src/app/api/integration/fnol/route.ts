import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db/mongodb';
import { validateFnol } from '@/lib/validation-engine';
import { runFraudChecks } from '@/lib/fraud-detection';
import { successResponse, errorResponse } from '@/lib/api-response';
import AuditLog from '@/models/AuditLog';

const fnolSchema = z.object({
  fnolId: z.string().min(1),
  policyNumber: z.string().min(1),
  incidentDate: z.string().datetime({ message: 'incidentDate must be ISO 8601' }),
  claimType: z.enum([
    'OWN_DAMAGE', 'THIRD_PARTY', 'THEFT', 'MEDICAL', 'FIRE',
    'PROPERTY_DAMAGE', 'NATURAL_DISASTER',
  ]),
  vehicleNumber: z.string().optional(),
  claimAmount: z.number().nonnegative().optional(),
  description: z.string().optional(),
  incidentLocation: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const input = fnolSchema.parse(body);

    // Step 1: Structural + rule-driven validation
    const validation = await validateFnol({
      policyNumber: input.policyNumber,
      vehicleNumber: input.vehicleNumber,
      claimAmount: input.claimAmount,
      claimType: input.claimType,
      incidentDate: input.incidentDate,
    });

    // Step 2: Fraud checks (only when validation passes)
    let fraud = null;
    if (validation.valid && validation.policyId) {
      fraud = await runFraudChecks({
        policyId: validation.policyId,
        vehicleNumber: input.vehicleNumber,
        incidentDate: new Date(input.incidentDate),
        claimAmount: input.claimAmount,
        claimType: input.claimType,
      });
    }

    // Audit the FNOL validation attempt
    await AuditLog.create({
      userId: 'INTELLIDOC_INTEGRATION',
      action: 'FNOL_VALIDATION',
      entity: 'FnolValidation',
      entityId: input.fnolId,
      newValue: {
        policyNumber: input.policyNumber,
        valid: validation.valid,
        violationCount: validation.violations.length,
        fraudFlagged: fraud?.isFraudulent ?? false,
      },
      timestamp: new Date(),
    });

    const response = {
      fnolId: input.fnolId,
      valid: validation.valid,
      policyId: validation.policyId,
      policyStatus: validation.policyStatus,
      customerId: validation.customerId,
      customerName: validation.customerName,
      coverageAvailable: validation.coverageAvailable,
      assetMatched: validation.assetMatched,
      violations: validation.violations,
      warnings: validation.warnings,
      fraud: fraud
        ? {
            isFraudulent: fraud.isFraudulent,
            severity: fraud.severity,
            flags: fraud.flags,
            details: fraud.details,
          }
        : null,
      policyDetails: validation.details,
    };

    if (!validation.valid) {
      return NextResponse.json(
        successResponse(response, 'FNOL validation failed — claim cannot be registered'),
        { status: 422 }
      );
    }

    return NextResponse.json(
      successResponse(response, 'FNOL validated successfully — ready for claim registration'),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse(error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')),
        { status: 400 }
      );
    }
    console.error('FNOL validation error:', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
