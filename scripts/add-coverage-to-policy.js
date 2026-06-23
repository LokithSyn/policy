const mongoose = require('mongoose');
const path = require('path');

// Load env variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI;

async function addCoverageToPolicy() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get the schemas
    const policySchema = new mongoose.Schema({}, { strict: false });
    const coverageSchema = new mongoose.Schema({}, { strict: false });

    const Policy = mongoose.model('Policy', policySchema, 'Policy');
    const Coverage = mongoose.model('Coverage', coverageSchema, 'Coverage');

    // Find the policy
    const policy = await Policy.findOne({ policyNumber: 'GL-554109-2025' });
    console.log('Found policy:', policy?.policyNumber);

    if (!policy) {
      console.log('Policy GL-554109-2025 not found');
      process.exit(1);
    }

    console.log('Policy effective date:', policy.effectiveDate);
    console.log('Policy expiry date:', policy.expiryDate);
    console.log('Policy policyId:', policy.policyId);

    // Check if Bodily Injury coverage already exists
    const existingCoverage = await Coverage.findOne({
      policyId: policy.policyId,
      coverageName: { $regex: 'Bodily Injury', $options: 'i' }
    });

    if (existingCoverage) {
      console.log('Bodily Injury coverage already exists');
    } else {
      // Create new coverage
      const coverage = new Coverage({
        coverId: `COV-${Date.now()}-BI`,
        policyId: policy.policyId,
        coverageName: 'Bodily Injury',
        coverageType: 'Personal Injury',
        sumInsured: 1000000,
        premium: 50000,
        deductible: 10000,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await coverage.save();
      console.log('✅ Added Bodily Injury coverage:', coverage.coverId);
    }

    // Update policy dates to match IntelliDoc data if needed
    const effectiveDate = new Date('2025-05-01');
    const expiryDate = new Date('2026-05-01');

    if (new Date(policy.effectiveDate) > effectiveDate || new Date(policy.expiryDate) < expiryDate) {
      await Policy.updateOne(
        { policyNumber: 'GL-554109-2025' },
        {
          effectiveDate: effectiveDate,
          expiryDate: expiryDate
        }
      );
      console.log('✅ Updated policy dates:');
      console.log('   Effective: 2025-05-01');
      console.log('   Expiry: 2026-05-01');
    }

    console.log('\n✅ All done! Policy is ready for validation.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addCoverageToPolicy();
