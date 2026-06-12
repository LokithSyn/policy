import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db/mongodb';
import { validateFnol } from '@/lib/validation-engine';
import { runFraudChecks } from '@/lib/fraud-detection';
import { registerClaim } from '@/lib/claim-registration';
import { getRequiredDocuments } from '@/lib/document-rules';
import { successResponse, errorResponse } from '@/lib/api-response';

const createClaimSchema = z.object({
  fnolId: z.string().min(1),
  fnolNumber: z.string().optional(),
  policyNumber: z.string().min(1),
  incidentDate: z.string().datetime(),
  claimType: z.enum([
    'OWN_DAMAGE', 'THIRD_PARTY', 'THEFT', 'MEDICAL', 'FIRE',
    'PROPERTY_DAMAGE', 'NATURAL_DISASTER',
  ]),
  vehicleNumber: z.string().optional(),
  claimAmount: z.number().nonnegative(),
  description: z.string().optional(),
  incidentLocation: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const input = createClaimSchema.parse(body);

    // Re-validate to get fresh policy state
    const validation = await validateFnol({
      policyNumber: input.policyNumber,
      vehicleNumber: input.vehicleNumber,
      claimAmount: input.claimAmount,
      claimType: input.claimType,
      incidentDate: input.incidentDate,
    });

    if (!validation.valid) {
      return NextResponse.json(
        errorResponse(
          `Cannot register claim — validation failed: ${validation.violations.map((v) => v.message).join('; ')}`
        ),
        { status: 422 }
      );
    }

    if (!validation.policyId) {
      return NextResponse.json(errorResponse('Policy ID could not be resolved'), { status: 422 });
    }

    // Fraud assessment
    const fraud = await runFraudChecks({
      policyId: validation.policyId,
      vehicleNumber: input.vehicleNumber,
      incidentDate: new Date(input.incidentDate),
      claimAmount: input.claimAmount,
      claimType: input.claimType,
    });

    // Register the claim
    const result = await registerClaim({
      fnolId: input.fnolId,
      fnolNumber: input.fnolNumber,
      policyId: validation.policyId,
      claimType: input.claimType,
      incidentDate: new Date(input.incidentDate),
      vehicleNumber: input.vehicleNumber,
      description: input.description,
      incidentLocation: input.incidentLocation,
      claimAmount: input.claimAmount,
      validation,
      fraud,
      registeredBy: 'INTELLIDOC_INTEGRATION',
    });

    if (!result.success) {
      return NextResponse.json(errorResponse(result.error ?? 'Claim registration failed'), {
        status: 409,
      });
    }

    // Fetch required documents for the registered claim
    const docRequirements = await getRequiredDocuments(
      result.claimId!,
      input.claimType,
      undefined
    );

    return NextResponse.json(
      successResponse(
        {
          claimId: result.claimId,
          claimNumber: result.claimNumber,
          workflowStatus: result.workflowStatus,
          fnolId: input.fnolId,
          policyId: validation.policyId,
          customerName: validation.customerName,
          fraud: {
            isFraudulent: fraud.isFraudulent,
            severity: fraud.severity,
            flags: fraud.flags,
          },
          requiredDocuments: docRequirements.requiredDocuments,
          missingMandatory: docRequirements.missingMandatory,
        },
        'Claim registered successfully'
      ),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse(error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')),
        { status: 400 }
      );
    }
    console.error('Create claim error:', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
