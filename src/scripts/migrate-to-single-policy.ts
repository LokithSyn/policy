import 'dotenv/config';
import mongoose from 'mongoose';
import Policy from '../models/Policy';
import Coverage from '../models/Coverage';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lokithsairam_db_user:qwertyuiop@policy.6moaurz.mongodb.net/intellipolicy';

async function main() {
  try {
    console.log('🌱 Starting migration...');
    console.log('📍 Connecting to:', MONGODB_URI.replace(/:[^@]*@/, ':****@'));
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing policies and coverages
    console.log('\n🗑️  Clearing existing data...');
    const policyDelete = await Policy.deleteMany({});
    const coverageDelete = await Coverage.deleteMany({});
    console.log(`✓ Deleted ${policyDelete.deletedCount} policies`);
    console.log(`✓ Deleted ${coverageDelete.deletedCount} coverages`);

    // Create new policy
    console.log('\n📋 Creating new policy...');
    const newPolicy = await Policy.create({
      policyId: 'POL-2026-000001',
      policyNumber: 'POL-2026-000001',
      customerId: 'CUST-2026-000001',
      policyType: 'Property',
      productCode: 'PRD-001',
      insurerName: 'Synergech Insurance',
      issueDate: new Date(),
      effectiveDate: new Date(),
      expiryDate: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()),
      premiumAmount: 50000,
      sumInsured: 1000000,
      policyStatus: 'ACTIVE',
      branchCode: 'BR-001',
    });
    console.log(`✓ Created policy: ${newPolicy.policyNumber}`);

    // Create coverages for the new policy
    console.log('\n📦 Creating coverages...');
    const coverageData = [
      { name: 'Bodily Injury', code: 'BI' },
      { name: 'Property Damage', code: 'PD' },
      { name: 'Personal Injury', code: 'PI' },
      { name: 'Advertising Injury', code: 'AI' },
      { name: 'Third-party Liability', code: 'TPL' },
    ];

    let coverageCounter = 0;
    const coverages = [];
    for (const coverage of coverageData) {
      coverageCounter++;
      coverages.push({
        coverageId: `COV-2026-${String(coverageCounter).padStart(6, '0')}`,
        policyId: newPolicy.policyId,
        coverageCode: coverage.code,
        coverageName: coverage.name,
        coverageLimit: 500000,
        deductible: 10000,
        status: 'ACTIVE',
      });
    }

    await Coverage.insertMany(coverages);
    console.log(`✓ Created ${coverages.length} coverages`);

    console.log('\n✅ Migration completed successfully!');
    console.log(`\nPolicy Summary:
      - Policy Number: ${newPolicy.policyNumber}
      - Policy Type: ${newPolicy.policyType}
      - Status: ${newPolicy.policyStatus}
      - Coverages: ${coverages.length}`);

    coverages.forEach((cov, idx) => {
      console.log(`  ${idx + 1}. ${cov.coverageName} (${cov.coverageCode})`);
    });

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
