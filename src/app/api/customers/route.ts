import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Customer from '@/models/Customer';
import { errorResponse, successResponse } from '@/lib/api-response';
import { z } from 'zod';

const createCustomerSchema = z.object({
  customerId: z.string().optional(),
  customerType: z.enum(['Individual', 'Corporate']),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().datetime(),
  gender: z.enum(['Male', 'Female', 'Other']),
  email: z.string().email(),
  mobile: z.string().min(10),
  aadhaarMasked: z.string().optional(),
  panMasked: z.string().optional(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
});

export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    const searchParams = _request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const customerType = searchParams.get('customerType') || '';

    const query: any = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (customerType) {
      query.customerType = customerType;
    }

    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      Customer.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Customer.countDocuments(query),
    ]);

    return NextResponse.json(
      successResponse({
        customers: customers.map((c) => ({
          customerId: c.customerId,
          customerType: c.customerType,
          firstName: c.firstName,
          lastName: c.lastName,
          fullName: `${c.firstName} ${c.lastName}`,
          email: c.email,
          mobile: c.mobile,
          city: c.city,
          state: c.state,
          createdAt: c.createdAt,
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
    console.error('Error fetching customers:', error);
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
    const validated = createCustomerSchema.parse(body);

    const customerId = validated.customerId || `CUST-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

    const existing = await Customer.findOne({ customerId });
    if (existing) {
      return NextResponse.json(
        errorResponse('Customer ID already exists'),
        { status: 400 }
      );
    }

    const customer = new Customer({
      ...validated,
      customerId,
      dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : undefined,
    });

    await customer.save();

    return NextResponse.json(
      successResponse(customer, 'Customer created successfully'),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse(error.errors[0].message),
        { status: 400 }
      );
    }
    console.error('Error creating customer:', error);
    const msg = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'Internal server error';
    return NextResponse.json(
      errorResponse(msg),
      { status: 500 }
    );
  }
}
