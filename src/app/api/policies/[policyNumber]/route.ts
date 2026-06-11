import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Policy from '@/models/Policy';
import Customer from '@/models/Customer';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(
  _request: NextRequest,
  { params }: { params: { policyNumber: string } }
) {
  try {
    await connectDB();

    const policy = await Policy.findOne({ policyNumber: params.policyNumber });

    if (!policy) {
      return NextResponse.json(
        errorResponse('Policy not found'),
        { status: 404 }
      );
    }

    // Fetch customer data by customerId
    const customer = await Customer.findOne({ customerId: policy.customerId });
    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown';

    return NextResponse.json(
      successResponse({
        policyId: policy.policyId,
        policyNumber: policy.policyNumber,
        customerId: policy.customerId,
        customerName,
        policyType: policy.policyType,
        sumInsured: policy.sumInsured,
        policyStatus: policy.policyStatus,
        effectiveDate: policy.effectiveDate,
        expiryDate: policy.expiryDate,
        premiumAmount: policy.premiumAmount,
        insurerName: policy.insurerName,
        productCode: policy.productCode,
        eligible: policy.policyStatus === 'ACTIVE',
      })
    );
  } catch (error) {
    console.error('Error fetching policy:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
