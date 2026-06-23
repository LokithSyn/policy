import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Customer from '@/models/Customer';
import { findByCustomerId } from '@/lib/repository/policy.repository';
import { errorResponse, successResponse } from '@/lib/api-response';
import { z } from 'zod';

const updateCustomerSchema = z.object({
  customerType: z.enum(['Individual', 'Corporate']).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  email: z.string().email().optional(),
  mobile: z.string().min(10).optional(),
  aadhaarMasked: z.string().optional(),
  panMasked: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    await connectDB();

    const customer = await Customer.findOne({ customerId: params.customerId });
    if (!customer) {
      return NextResponse.json(
        errorResponse('Customer not found'),
        { status: 404 }
      );
    }

    const policies = await findByCustomerId(params.customerId);

    return NextResponse.json(
      successResponse({
        customerId: customer.customerId,
        customerType: customer.customerType,
        firstName: customer.firstName,
        lastName: customer.lastName,
        dateOfBirth: customer.dateOfBirth,
        gender: customer.gender,
        email: customer.email,
        mobile: customer.mobile,
        aadhaarMasked: customer.aadhaarMasked,
        panMasked: customer.panMasked,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        policyCount: policies?.length || 0,
        policies: policies?.map((p) => ({
          policyId: p.policyId,
          policyNumber: p.policyNumber,
          policyType: p.policyType,
          policyStatus: p.policyStatus,
          effectiveDate: p.effectiveDate,
          expiryDate: p.expiryDate,
        })) || [],
      })
    );
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    await connectDB();

    const customer = await Customer.findOne({ customerId: params.customerId });
    if (!customer) {
      return NextResponse.json(
        errorResponse('Customer not found'),
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateCustomerSchema.parse(body);

    const updateData: any = { ...validated };
    if (validated.dateOfBirth) {
      updateData.dateOfBirth = new Date(validated.dateOfBirth);
    }

    const updated = await Customer.findOneAndUpdate(
      { customerId: params.customerId },
      updateData,
      { new: true }
    );

    return NextResponse.json(
      successResponse(updated, 'Customer updated successfully'),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse(error.errors[0].message),
        { status: 400 }
      );
    }
    console.error('Error updating customer:', error);
    const msg = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'Internal server error';
    return NextResponse.json(
      errorResponse(msg),
      { status: 500 }
    );
  }
}
