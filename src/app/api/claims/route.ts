import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import ClaimsHistory from '@/models/Claim';
import Policy from '@/models/Policy';
import Customer from '@/models/Customer';
import { errorResponse, successResponse } from '@/lib/api-response';
import { z } from 'zod';

const createClaimSchema = z.object({
  claimNumber: z.string().min(1),
  policyId: z.string().min(1),
  claimAmount: z.number().positive(),
  incidentDate: z.string().datetime(),
  claimStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW', 'SETTLED']).optional(),
  claimType: z.enum(['OWN_DAMAGE', 'THIRD_PARTY', 'THEFT', 'MEDICAL', 'FIRE']),
});

export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    const searchParams = _request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || '';

    const query: any = {};
    if (status) {
      query.claimStatus = status;
    }

    const skip = (page - 1) * limit;

    const [claims, total] = await Promise.all([
      ClaimsHistory.find(query).skip(skip).limit(limit).sort({ incidentDate: -1 }),
      ClaimsHistory.countDocuments(query),
    ]);

    // Fetch policy data for all claims
    const policyIds = [...new Set(claims.map(c => c.policyId))];
    const policies = await Policy.find({ policyId: { $in: policyIds } });
    const policyMap = new Map(policies.map(p => [p.policyId, p]));

    // Fetch customer data for all policies
    const customerIds = [...new Set(policies.map(p => p.customerId))];
    const customers = await Customer.find({ customerId: { $in: customerIds } });
    const customerMap = new Map(customers.map(c => [c.customerId, c]));

    return NextResponse.json(
      successResponse({
        claims: claims.map((c) => {
          const policy = policyMap.get(c.policyId);
          const customer = policy ? customerMap.get(policy.customerId) : null;
          const memberName = customer ? `${customer.firstName} ${customer.lastName}` : 'N/A';
          const policyNumber = policy?.policyNumber || 'N/A';

          return {
            claimNumber: c.claimNumber,
            policyNumber,
            memberName,
            hospital: 'N/A', // Not in ClaimsHistory model
            claimAmount: c.claimAmount,
            approvedAmount: c.approvedAmount,
            status: c.claimStatus,
            incidentDate: c.incidentDate,
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
    console.error('Error fetching claims:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  try {
    await connectDB();

    const body = await _request.json();
    const validated = createClaimSchema.parse(body);

    // Check if claim already exists
    const existing = await ClaimsHistory.findOne({ claimNumber: validated.claimNumber });
    if (existing) {
      return NextResponse.json(
        errorResponse('Claim number already exists'),
        { status: 400 }
      );
    }

    const claimId = `CLM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
    const claim = new ClaimsHistory({
      claimId,
      ...validated,
      incidentDate: new Date(validated.incidentDate),
      claimStatus: validated.claimStatus || 'PENDING',
    });

    await claim.save();

    return NextResponse.json(
      successResponse(claim, 'Claim created successfully'),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse(error.errors[0].message),
        { status: 400 }
      );
    }
    console.error('Error creating claim:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
