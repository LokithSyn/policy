import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { validatorEngine, ClaimValidationData, ValidationResult } from '@/lib/validator-engine';
import { claimNumberGenerator } from '@/lib/claim-number-generator';
import Claim from '@/models/Claim';
import ValidatorConfiguration from '@/models/ValidatorConfiguration';
import { errorResponse, successResponse } from '@/lib/api-response';
import { z } from 'zod';

// Flexible FNOL schema - accepts any fields
const fnolSchema = z.record(z.any());

interface ValidationErrorDetail {
  field: string;
  code: string;
  message: string;
}

interface ValidatorResponse {
  status: 'SUCCESS' | 'FAILED';
  claimCreated: boolean;
  claimNumber: string | null;
  validationSummary: {
    totalRules: number;
    passed: number;
    failed: number;
  };
  validationErrors?: ValidationErrorDetail[];
  fnolData: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate basic structure
    const fnolData = fnolSchema.parse(body);

    // Extract key fields for validation
    const claimType = fnolData.claimType || 'Commercial General Liability';
    const coverageType = fnolData.coverageType || 'Bodily Injury';
    const policyNumber = fnolData.policyNumber;

    if (!policyNumber) {
      return NextResponse.json(
        {
          status: 'FAILED',
          claimCreated: false,
          claimNumber: null,
          validationSummary: {
            totalRules: 0,
            passed: 0,
            failed: 1,
          },
          validationErrors: [
            {
              field: 'policyNumber',
              code: 'MISSING_REQUIRED_FIELD',
              message: 'Policy number is required',
            },
          ],
          fnolData,
        } as ValidatorResponse,
        { status: 400 }
      );
    }

    // Get validator configuration
    const config = await ValidatorConfiguration.findOne({
      claimType,
      coverageType,
      isActive: true,
    });

    // Prepare validation data
    const validationData: ClaimValidationData = {
      policyNumber,
      claimType,
      coverageType,
      incidentDate: fnolData.incidentDate || '',
      claimantName: fnolData.claimantName || '',
      sumInsured: fnolData.sumInsured || 0,
      estimatedLoss: fnolData.estimatedLoss || 0,
      documents: fnolData.documents || [],
    };

    // Run validations
    const validationResult = await validatorEngine.runFullValidation(validationData);

    // Prepare response
    const totalRules = validationResult.results.length;
    const passedRules = validationResult.results.filter((r) => r.status === 'PASS').length;
    const failedRules = validationResult.results.filter((r) => r.status === 'FAIL').length;

    // If validation fails, return without creating claim
    if (!validationResult.passed) {
      const validationErrors: ValidationErrorDetail[] = validationResult.results
        .filter((r) => r.status === 'FAIL')
        .map((r) => ({
          field: r.fieldName,
          code: `${r.validationType.toUpperCase().replace(/ /g, '_')}_FAILED`,
          message: r.message,
        }));

      const failureResponse: ValidatorResponse = {
        status: 'FAILED',
        claimCreated: false,
        claimNumber: null,
        validationSummary: {
          totalRules,
          passed: passedRules,
          failed: failedRules,
        },
        validationErrors,
        fnolData,
      };

      return NextResponse.json(failureResponse, { status: 200 });
    }

    // All validations passed - generate claim number and create claim
    try {
      const claimNumberConfig = config
        ? config.claimNumberConfig
        : {
            prefix: 'CLM',
            year: new Date().getFullYear(),
            sequenceStart: 1,
            sequencePadding: 6,
          };

      const claimNumber = await claimNumberGenerator.generateClaimNumber(claimNumberConfig);

      // Create claim record
      const claim = await Claim.create({
        claimId: claimNumber,
        claimNumber,
        policyId: `POL-${policyNumber}`,
        policyNumber,
        claimType,
        incidentDate: fnolData.incidentDate ? new Date(fnolData.incidentDate) : new Date(),
        claimAmount: validationData.estimatedLoss,
        approvedAmount: 0,
        claimStatus: 'REGISTERED',
        fnolData,
      });

      // Append claim number to FNOL data
      const enrichedFnolData = {
        ...fnolData,
        claimNumber,
      };

      const successResponse: ValidatorResponse = {
        status: 'SUCCESS',
        claimCreated: true,
        claimNumber,
        validationSummary: {
          totalRules,
          passed: passedRules,
          failed: failedRules,
        },
        fnolData: enrichedFnolData,
      };

      return NextResponse.json(successResponse, { status: 201 });
    } catch (claimError) {
      console.error('Error creating claim:', claimError);
      throw new Error(`Claim creation failed: ${claimError instanceof Error ? claimError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Validation error:', error);
    const msg = process.env.NODE_ENV === 'development'
      ? (error instanceof Error ? error.message : String(error))
      : 'Internal server error';

    return NextResponse.json(
      errorResponse(msg),
      { status: 500 }
    );
  }
}
