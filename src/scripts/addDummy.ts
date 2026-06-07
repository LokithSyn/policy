import mongoose from 'mongoose';
import Policy from '../models/Policy.ts';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intellipolicy';

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);

    const dummy = {
      policyNumber: 'POL-TEST-000001',
      memberId: 'MEM-00000001',
      memberName: 'Test User',
      dob: new Date('1985-01-01'),
      gender: 'Other',
      email: 'test.user@example.com',
      phone: '+911234567890',
      policyType: 'Individual',
      sumInsured: 500000,
      deductible: 5000,
      coPay: 10,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      status: 'Active',
    } as any;

    const res = await Policy.findOneAndUpdate(
      { policyNumber: dummy.policyNumber },
      { $set: dummy },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('Upserted policy:', res?.policyNumber || '(no result)');
  } catch (err) {
    console.error('Error adding dummy policy:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();
