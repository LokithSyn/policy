import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db/mongodb';
import FraudRule from '@/models/FraudRule';
import { successResponse, errorResponse } from '@/lib/api-response';

const fraudRuleSchema = z.object({
  ruleCode: z.string().min(1),
  ruleName: z.string().min(1),
  description: z.string().min(1),
  ruleType: z.enum(['THRESHOLD', 'DUPLICATE', 'PATTERN', 'VELOCITY']),
  field: z.string().optional(),
  operator: z.string().optional(),
  thresholdValue: z.number().optional(),
  windowDays: z.number().optional(),
  flagMessage: z.string().min(1),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  isActive: z.boolean().optional(),
  priority: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const active = searchParams.get('active');

    const query: Record<string, unknown> = {};
    if (active !== null) query.isActive = active === 'true';

    const rules = await FraudRule.find(query).sort({ priority: 1 });

    return NextResponse.json(successResponse({ rules, total: rules.length }));
  } catch (error) {
    console.error('Get fraud rules error:', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const input = fraudRuleSchema.parse(body);

    const existing = await FraudRule.findOne({ ruleCode: input.ruleCode });
    if (existing) {
      return NextResponse.json(
        errorResponse(`Fraud rule '${input.ruleCode}' already exists`),
        { status: 409 }
      );
    }

    const rule = await FraudRule.create(input);

    return NextResponse.json(successResponse(rule, 'Fraud rule created'), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse(error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')),
        { status: 400 }
      );
    }
    console.error('Create fraud rule error:', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
