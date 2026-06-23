import 'dotenv/config';
import mongoose from 'mongoose';
import Policy from '../models/Policy';
import Coverage from '../models/Coverage';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lokithsairam_db_user:qwertyuiop@policy.6moaurz.mongodb.net/intellipolicy';

const POLICY_TYPES = ['Motor', 'Health', 'Property', 'Life', 'Travel'];

const COVERAGES = [
  { name: 'Bodily Injury', code: 'BI' },
  { name: 'Property Damage', code: 'PD' },
  { name: 'Personal Injury', code: 'PI' },
  { name: 'Advertising Injury', code: 'AI' },
  { name: 'Third-party Liability', code: 'TPL' },
];

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

    // Create policies for each type
    console.log('\n📋 Creating policies...');
    let policyCounter = 0;
    let coverageCounter = 0;
    const createdPolicies = [];

    for (const policyType of POLICY_TYPES) {
      policyCounter++;
      const newPolicy = await Policy.create({
        policyId: `POL-2026-${String(policyCounter).padStart(6, '0')}`,
        policyNumber: `POL-2026-${String(policyCounter).padStart(6, '0')}`,
        customerId: `CUST-2026-${String(policyCounter).padStart(6, '0')}`,
        policyType: policyType as 'Motor' | 'Health' | 'Property' | 'Life' | 'Travel',
        productCode: `PRD-${String(policyCounter).padStart(3, '0')}`,
        insurerName: 'Synergech Insurance',
        issueDate: new Date(),
        effectiveDate: new Date(),
        expiryDate: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()),
        premiumAmount: 50000,
        sumInsured: 1000000,
        policyStatus: 'ACTIVE',
        branchCode: 'BR-001',
      });
      createdPolicies.push(newPolicy);
      console.log(`✓ Created ${policyType} policy: ${newPolicy.policyNumber}`);

      // Create coverages for this policy
      for (const coverage of COVERAGES) {
        coverageCounter++;
        await Coverage.create({
          coverageId: `COV-2026-${String(coverageCounter).padStart(6, '0')}`,
          policyId: newPolicy.policyId,
          coverageCode: coverage.code,
          coverageName: coverage.name,
          coverageLimit: 500000,
          deductible: 10000,
          status: 'ACTIVE',
        });
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log(`\nPolicies Created: ${POLICY_TYPES.length}`);
    console.log(`Total Coverages: ${coverageCounter}`);

    createdPolicies.forEach((policy, idx) => {
      console.log(`\n${idx + 1}. ${policy.policyType} Policy - ${policy.policyNumber}`);
      COVERAGES.forEach((cov, covIdx) => {
        console.log(`   ${covIdx + 1}. ${cov.name} (${cov.code})`);
      });
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
