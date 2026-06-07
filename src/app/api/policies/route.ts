import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Policy from '@/models/Policy';
import { errorResponse, successResponse } from '@/lib/api-response';
import { z } from 'zod';

const createPolicySchema = z.object({
  policyNumber: z.string().min(1),
  memberId: z.string().min(1),
  memberName: z.string().min(1),
  dob: z.string().datetime(),
  gender: z.enum(['Male', 'Female', 'Other']),
  email: z.string().email(),
  phone: z.string(),
  policyType: z.enum(['Individual', 'Family Floater', 'Corporate']),
  sumInsured: z.number().positive(),
  deductible: z.number().nonnegative().optional(),
  coPay: z.number().nonnegative().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.enum(['Active', 'Expired', 'Suspended']).optional(),
});

export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    const searchParams = _request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const query: any = {};

    if (search) {
      query.$or = [
        { policyNumber: { $regex: search, $options: 'i' } },
        { memberName: { $regex: search, $options: 'i' } },
        { memberId: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [policies, total] = await Promise.all([
      Policy.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Policy.countDocuments(query),
    ]);

    return NextResponse.json(
      successResponse({
        policies: policies.map((p) => ({
          policyNumber: p.policyNumber,
          memberName: p.memberName,
          memberId: p.memberId,
          policyType: p.policyType,
          sumInsured: p.sumInsured,
          status: p.status,
          startDate: p.startDate,
          endDate: p.endDate,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    console.error('Error fetching policies:', error);
    const msg = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'Internal server error';
    return NextResponse.json(
      errorResponse(msg),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validated = createPolicySchema.parse(body);

    // Check if policy already exists
    const existing = await Policy.findOne({ policyNumber: validated.policyNumber });
    if (existing) {
      return NextResponse.json(
        errorResponse('Policy number already exists'),
        { status: 400 }
      );
    }

    const policy = new Policy({
      ...validated,
      dob: new Date(validated.dob),
      startDate: new Date(validated.startDate),
      endDate: new Date(validated.endDate),
      deductible: validated.deductible || 0,
      coPay: validated.coPay || 0,
      status: validated.status || 'Active',
    });

    await policy.save();

    return NextResponse.json(
      successResponse(policy, 'Policy created successfully'),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse(error.errors[0].message),
        { status: 400 }
      );
    }
    console.error('Error creating policy:', error);
    const msg = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'Internal server error';
    return NextResponse.json(
      errorResponse(msg),
      { status: 500 }
    );
  }
}
