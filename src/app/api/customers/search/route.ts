import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Customer from '@/models/Customer';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (query.length < 3) {
      return NextResponse.json(
        successResponse({
          customers: [],
          message: 'Enter at least 3 characters to search',
        })
      );
    }

    const customers = await Customer.find({
      $or: [
        { customerId: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    })
      .select('customerId firstName lastName email mobile')
      .limit(10);

    return NextResponse.json(
      successResponse({
        customers: customers.map((c) => ({
          customerId: c.customerId,
          firstName: c.firstName,
          lastName: c.lastName,
          fullName: `${c.firstName} ${c.lastName}`,
          email: c.email,
          mobile: c.mobile,
        })),
      })
    );
  } catch (error) {
    console.error('Error searching customers:', error);
    const msg = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'Internal server error';
    return NextResponse.json(
      errorResponse(msg),
      { status: 500 }
    );
  }
}
