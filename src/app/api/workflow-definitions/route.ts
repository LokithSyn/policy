import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db/mongodb';
import WorkflowDefinition from '@/models/WorkflowDefinition';
import { successResponse, errorResponse } from '@/lib/api-response';

const workflowSchema = z.object({
  workflowCode: z.string().min(1),
  workflowName: z.string().min(1),
  entityType: z.string().min(1),
  initialStatus: z.string().min(1),
  terminalStatuses: z.array(z.string()),
  transitions: z.array(
    z.object({
      fromStatus: z.string().min(1),
      toStatus: z.string().min(1),
      allowedRoles: z.array(z.string()).optional(),
      requiresComment: z.boolean().optional(),
      autoTrigger: z.boolean().optional(),
      triggerCondition: z.string().optional(),
    })
  ),
  isActive: z.boolean().optional(),
  version: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entityType');

    const query: Record<string, unknown> = {};
    if (entityType) query.entityType = entityType;

    const definitions = await WorkflowDefinition.find(query);

    return NextResponse.json(successResponse({ definitions, total: definitions.length }));
  } catch (error) {
    console.error('Get workflow definitions error:', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const input = workflowSchema.parse(body);

    const existing = await WorkflowDefinition.findOne({ workflowCode: input.workflowCode });
    if (existing) {
      return NextResponse.json(
        errorResponse(`Workflow '${input.workflowCode}' already exists`),
        { status: 409 }
      );
    }

    const definition = await WorkflowDefinition.create(input);

    return NextResponse.json(
      successResponse(definition, 'Workflow definition created'),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse(error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')),
        { status: 400 }
      );
    }
    console.error('Create workflow definition error:', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
