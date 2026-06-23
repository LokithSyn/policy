import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { validatorEngine, ClaimValidationData } from '@/lib/validator-engine';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json() as ClaimValidationData;

    // Validate required fields
    if (!body.policyNumber || !body.claimType || !body.coverageType) {
      return NextResponse.json(
        errorResponse('Missing required fields: policyNumber, claimType, coverageType'),
        { status: 400 }
      );
    }

    // Run full validation
    const validationResult = await validatorEngine.runFullValidation(body);

    if (validationResult.passed) {
      return NextResponse.json(
        successResponse({
          validationPassed: true,
          results: validationResult.results,
          message: 'All validations passed. Claim can be created.',
        }),
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        successResponse({
          validationPassed: false,
          results: validationResult.results,
          failedFields: validationResult.failedFields,
          message: `Validation failed for ${validationResult.failedFields.length} field(s)`,
        }),
        { status: 200 }
      );
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

export async function GET() {
  try {
    await connectDB();

    // Return available validation types and sources
    const validationTypes = [
      'Exact Match',
      'Date Validation',
      'Coverage Validation',
      'Eligibility Validation',
      'Financial Validation',
      'Duplicate Validation',
      'Required Validation',
      'Document Validation',
      'Third Party Validation',
      'Policy Period Validation',
      'Legal Validation',
      'Fraud Validation',
    ];

    const validationSources = [
      'Application Database',
      'External Insurance API',
      'Policy Service',
      'Customer Service',
      'Coverage Service',
      'Claims Service',
      'Document Service',
      'Rules Engine',
    ];

    const claimTypes = [
      'Commercial General Liability',
      'Motor Insurance',
      'Health Insurance',
      'Property Insurance',
      'Travel Insurance',
    ];

    const coverageTypes = [
      'Bodily Injury',
      'Property Damage',
      'Personal Injury',
      'Advertising Injury',
      'Third-party Liability',
    ];

    return NextResponse.json(
      successResponse({
        validationTypes,
        validationSources,
        claimTypes,
        coverageTypes,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching validator metadata:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
