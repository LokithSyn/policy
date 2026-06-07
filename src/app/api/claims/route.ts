import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Claim from '@/models/Claim';
import { errorResponse, successResponse } from '@/lib/api-response';
import { z } from 'zod';

const createClaimSchema = z.object({
  claimNumber: z.string().min(1),
  policyNumber: z.string().min(1),
  memberName: z.string().min(1),
  hospitalName: z.string().min(1),
  claimAmount: z.number().positive(),
  admissionDate: z.string().datetime(),
  dischargeDate: z.string().datetime(),
  status: z.enum(['Pending', 'Approved', 'Rejected', 'Under Review']).optional(),
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
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [claims, total] = await Promise.all([
      Claim.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Claim.countDocuments(query),
    ]);

    return NextResponse.json(
      successResponse({
        claims: claims.map((c) => ({
          claimNumber: c.claimNumber,
          policyNumber: c.policyNumber,
          memberName: c.memberName,
          hospitalName: c.hospitalName,
          claimAmount: c.claimAmount,
          approvedAmount: c.approvedAmount,
          status: c.status,
          claimDate: c.claimDate,
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
    const existing = await Claim.findOne({ claimNumber: validated.claimNumber });
    if (existing) {
      return NextResponse.json(
        errorResponse('Claim number already exists'),
        { status: 400 }
      );
    }

    const claim = new Claim({
      ...validated,
      admissionDate: new Date(validated.admissionDate),
      dischargeDate: new Date(validated.dischargeDate),
      status: validated.status || 'Pending',
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
