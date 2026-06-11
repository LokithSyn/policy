import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Customer from '@/models/Customer';
import { findByCustomerId } from '@/lib/repository/policy.repository';
import { errorResponse, successResponse } from '@/lib/api-response';

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
        firstName: customer.firstName,
        lastName: customer.lastName,
        customerType: customer.customerType,
        email: customer.email,
        mobile: customer.mobile,
        city: customer.city,
        state: customer.state,
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
