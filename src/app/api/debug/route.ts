import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectDB();

    const collections = await mongoose.connection.db?.listCollections().toArray();
    const policyCount = await mongoose.connection.db?.collection('policies').countDocuments();
    const customerCount = await mongoose.connection.db?.collection('customers').countDocuments();

    return NextResponse.json({
      connected: mongoose.connection.readyState === 1,
      database: mongoose.connection.db?.databaseName,
      policyCount,
      customerCount,
      collections: collections?.map(c => c.name),
      mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set',
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      connected: false,
      mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set',
    });
  }
}
