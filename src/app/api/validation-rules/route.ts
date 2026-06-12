import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db/mongodb';
import ValidationRule from '@/models/ValidationRule';
import { successResponse, errorResponse } from '@/lib/api-response';

const ruleSchema = z.object({
  ruleCode: z.string().min(1),
  ruleName: z.string().min(1),
  description: z.string().min(1),
  field: z.string().min(1),
  operator: z.enum(['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'IN', 'NOT_IN', 'IS_NULL', 'IS_NOT_NULL', 'REGEX']),
  value: z.string().optional(),
  errorMessage: z.string().min(1),
  severity: z.enum(['ERROR', 'WARNING']).optional(),
  category: z.string().min(1),
  isActive: z.boolean().optional(),
  priority: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const active = searchParams.get('active');

    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (active !== null) query.isActive = active === 'true';

    const rules = await ValidationRule.find(query).sort({ priority: 1 });

    return NextResponse.json(successResponse({ rules, total: rules.length }));
  } catch (error) {
    console.error('Get validation rules error:', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const input = ruleSchema.parse(body);

    const existing = await ValidationRule.findOne({ ruleCode: input.ruleCode });
    if (existing) {
      return NextResponse.json(
        errorResponse(`Validation rule '${input.ruleCode}' already exists`),
        { status: 409 }
      );
    }

    const rule = await ValidationRule.create(input);

    return NextResponse.json(successResponse(rule, 'Validation rule created'), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse(error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')),
        { status: 400 }
      );
    }
    console.error('Create validation rule error:', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
