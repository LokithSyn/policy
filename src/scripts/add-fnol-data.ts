import 'dotenv/config';
import mongoose from 'mongoose';
import Customer from '../models/Customer';
import Policy from '../models/Policy';
import Coverage from '../models/Coverage';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lokithsairam_db_user:qwertyuiop@policy.6moaurz.mongodb.net/intellipolicy';

async function main() {
  try {
    console.log('🌱 Starting FNOL data insertion...');
    console.log('📍 Connecting to:', MONGODB_URI.replace(/:[^@]*@/, ':****@'));
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Create Customer - Policy Holder (ABC Restaurant Pvt Ltd)
    console.log('\n👥 Creating customer...');
    const customer = await Customer.create({
      customerId: 'CUST-2026-000999',
      customerType: 'Corporate',
      firstName: 'ABC',
      lastName: 'Restaurant Pvt Ltd',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'Other',
      email: 'contact@abcrestaurant.com',
      mobile: '9876543210',
      aadhaarMasked: 'XXXX-XXXX-XXXX',
      panMasked: 'XXXXXXXXXXXXX',
      address: '123 Anna Salai',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600002',
    });
    console.log(`✓ Created customer: ${customer.customerId} - ${customer.firstName} ${customer.lastName}`);

    // Create Policy - Commercial General Liability
    console.log('\n📋 Creating policy...');
    const policy = await Policy.create({
      policyId: 'POL-2026-000201',
      policyNumber: 'GL-554109-2026-ABC',
      customerId: customer.customerId,
      customer: customer._id,
      policyType: 'Property',
      productCode: 'CGL-BI-2026',
      insurerName: 'Apex Indemnity Group Inc.',
      issueDate: new Date('2026-01-01'),
      effectiveDate: new Date('2026-01-01'),
      expiryDate: new Date('2026-12-31'),
      premiumAmount: 500000,
      sumInsured: 5000000,
      policyStatus: 'ACTIVE',
      agentCode: 'BRK-MUM-44102',
      branchCode: 'BR-CHN-001',
    });
    console.log(`✓ Created policy: ${policy.policyNumber}`);

    // Create Coverages for this policy
    console.log('\n📦 Creating coverages...');
    const coverages = await Coverage.create([
      {
        coverageId: 'COV-2026-100101',
        policyId: policy.policyId,
        policy: policy._id,
        coverageCode: 'BI',
        coverageName: 'Bodily Injury',
        coverageLimit: 5000000,
        deductible: 50000,
        status: 'ACTIVE',
      },
      {
        coverageId: 'COV-2026-100102',
        policyId: policy.policyId,
        policy: policy._id,
        coverageCode: 'PD',
        coverageName: 'Property Damage',
        coverageLimit: 5000000,
        deductible: 50000,
        status: 'ACTIVE',
      },
      {
        coverageId: 'COV-2026-100103',
        policyId: policy.policyId,
        policy: policy._id,
        coverageCode: 'PI',
        coverageName: 'Personal Injury',
        coverageLimit: 5000000,
        deductible: 50000,
        status: 'ACTIVE',
      },
      {
        coverageId: 'COV-2026-100104',
        policyId: policy.policyId,
        policy: policy._id,
        coverageCode: 'AI',
        coverageName: 'Advertising Injury',
        coverageLimit: 5000000,
        deductible: 50000,
        status: 'ACTIVE',
      },
      {
        coverageId: 'COV-2026-100105',
        policyId: policy.policyId,
        policy: policy._id,
        coverageCode: 'TPL',
        coverageName: 'Third-party Liability',
        coverageLimit: 5000000,
        deductible: 50000,
        status: 'ACTIVE',
      },
    ]);
    console.log(`✓ Created ${coverages.length} coverages`);

    console.log('\n✅ Data insertion completed successfully!');
    console.log(`
📊 Summary:
  - Customer: ABC Restaurant Pvt Ltd (CUST-2026-000101)
  - Policy: GL-554109-2025 (POL-2026-000101)
  - Policy Type: Property (Commercial General Liability)
  - Sum Insured: ₹50,00,000
  - Deductible: ₹50,000
  - Effective Date: 01-Jan-2026
  - Expiration Date: 31-Dec-2026
  - Coverages: ${coverages.length}
    1. Bodily Injury (BI)
    2. Property Damage (PD)
    3. Personal Injury (PI)
    4. Advertising Injury (AI)
    5. Third-party Liability (TPL)

🔗 Customer ID: CUST-2026-000101
🔗 Policy Number: GL-554109-2025
📍 Location: Chennai, Tamil Nadu
    `);

    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
