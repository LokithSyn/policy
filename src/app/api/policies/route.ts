import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Policy from '@/models/Policy';
import Customer from '@/models/Customer';
import { errorResponse, successResponse } from '@/lib/api-response';
import { z } from 'zod';

const createPolicySchema = z.object({
  policyNumber: z.string().min(1),
  customerId: z.string().min(1),
  policyType: z.enum(['Motor', 'Health', 'Property', 'Life', 'Travel']),
  productCode: z.string().min(1),
  insurerName: z.string().min(1),
  issueDate: z.string().datetime(),
  effectiveDate: z.string().datetime(),
  expiryDate: z.string().datetime(),
  premiumAmount: z.number().positive(),
  sumInsured: z.number().positive(),
  policyStatus: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED']).optional(),
  agentCode: z.string().optional(),
  branchCode: z.string().optional(),
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
        { customerId: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.policyStatus = status;
    }

    const skip = (page - 1) * limit;

    const [policies, total] = await Promise.all([
      Policy.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Policy.countDocuments(query),
    ]);

    // Fetch customer data for all policies
    const customerIds = [...new Set(policies.map(p => p.customerId))];
    const customers = await Customer.find({ customerId: { $in: customerIds } });
    const customerMap = new Map(customers.map(c => [c.customerId, c]));

    return NextResponse.json(
      successResponse({
        policies: policies.map((p) => {
          const customer = customerMap.get(p.customerId);
          const memberName = customer ? `${customer.firstName} ${customer.lastName}` : 'N/A';
          return {
            policyId: p.policyId,
            policyNumber: p.policyNumber,
            customerId: p.customerId,
            memberName,
            memberId: p.customerId,
            policyType: p.policyType,
            sumInsured: p.sumInsured,
            status: p.policyStatus,
            policyStatus: p.policyStatus,
            effectiveDate: p.effectiveDate,
            expiryDate: p.expiryDate,
          };
        }),
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

    const existing = await Policy.findOne({ policyNumber: validated.policyNumber });
    if (existing) {
      return NextResponse.json(
        errorResponse('Policy number already exists'),
        { status: 400 }
      );
    }

    const policyId = `POL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
    const policy = new Policy({
      policyId,
      ...validated,
      issueDate: new Date(validated.issueDate),
      effectiveDate: new Date(validated.effectiveDate),
      expiryDate: new Date(validated.expiryDate),
      policyStatus: validated.policyStatus || 'ACTIVE',
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
