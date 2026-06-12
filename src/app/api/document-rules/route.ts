import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db/mongodb';
import ClaimDocumentRule from '@/models/ClaimDocumentRule';
import { successResponse, errorResponse } from '@/lib/api-response';

const documentRuleSchema = z.object({
  ruleId: z.string().min(1),
  claimType: z.string().min(1),
  policyType: z.string().optional(),
  requiredDocuments: z.array(
    z.object({
      documentCode: z.string().min(1),
      documentName: z.string().min(1),
      isMandatory: z.boolean().optional(),
      description: z.string().optional(),
    })
  ),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const claimType = searchParams.get('claimType');
    const policyType = searchParams.get('policyType');

    const query: Record<string, unknown> = {};
    if (claimType) query.claimType = claimType;
    if (policyType) query.policyType = policyType;

    const rules = await ClaimDocumentRule.find(query).sort({ claimType: 1 });

    return NextResponse.json(successResponse({ rules, total: rules.length }));
  } catch (error) {
    console.error('Get document rules error:', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const input = documentRuleSchema.parse(body);

    const existing = await ClaimDocumentRule.findOne({ ruleId: input.ruleId });
    if (existing) {
      return NextResponse.json(
        errorResponse(`Document rule '${input.ruleId}' already exists`),
        { status: 409 }
      );
    }

    const rule = await ClaimDocumentRule.create(input);

    return NextResponse.json(successResponse(rule, 'Document rule created'), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse(error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')),
        { status: 400 }
      );
    }
    console.error('Create document rule error:', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
