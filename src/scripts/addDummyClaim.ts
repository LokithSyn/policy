import mongoose from 'mongoose';
import Claim from '../models/Claim.ts';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intellipolicy';

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);

    const dummy = {
      claimNumber: 'CLM-TEST-000001',
      policyNumber: 'POL-TEST-000001',
      memberName: 'Test User',
      hospitalName: 'Apollo Hospital',
      claimAmount: 25000,
      approvedAmount: 0,
      claimDate: new Date(),
      admissionDate: new Date(new Date().setDate(new Date().getDate() - 5)),
      dischargeDate: new Date(),
      status: 'Pending',
      reason: undefined,
    } as any;

    const res = await Claim.findOneAndUpdate(
      { claimNumber: dummy.claimNumber },
      { $set: dummy },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('Upserted claim:', res?.claimNumber || '(no result)');
  } catch (err) {
    console.error('Error adding dummy claim:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();
