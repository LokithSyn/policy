import 'dotenv/config';
import mongoose from 'mongoose';
import Agent from '../models/Agent';
import Customer from '../models/Customer';
import Policy from '../models/Policy';
import Coverage from '../models/Coverage';
import InsuredAsset from '../models/InsuredAsset';
import ClaimsHistory from '../models/Claim';
import PolicyDocument from '../models/PolicyDocument';
import Endorsement from '../models/Endorsement';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lokithsairam_db_user:qwertyuiop@policy.6moaurz.mongodb.net/intellipolicy';

const POLICY_TYPES = ['Motor', 'Health', 'Property', 'Life', 'Travel'];

const COVERAGES = [
  { name: 'Bodily Injury', code: 'BI' },
  { name: 'Property Damage', code: 'PD' },
  { name: 'Personal Injury', code: 'PI' },
  { name: 'Advertising Injury', code: 'AI' },
  { name: 'Third-party Liability', code: 'TPL' },
];

const FIRST_NAMES = [
  'Rajesh', 'Amit', 'Vikram', 'Arjun', 'Deepak', 'Priya', 'Neha', 'Anjali',
  'Aryan', 'Nikhil', 'Rohan', 'Varun', 'Akshay', 'Abhishek',
];

const LAST_NAMES = [
  'Kumar', 'Singh', 'Patel', 'Sharma', 'Gupta', 'Verma', 'Rao', 'Nair',
  'Desai', 'Reddy', 'Bhat', 'Chopra', 'Khan', 'Mehta',
];

const STATES = [
  'Tamil Nadu', 'Karnataka', 'Maharashtra', 'Delhi', 'Uttar Pradesh',
  'Rajasthan', 'Gujarat', 'Telangana', 'Haryana', 'Punjab',
];

const CITIES: Record<string, string[]> = {
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur'],
  'Delhi': ['New Delhi', 'Delhi', 'Dwarka'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara'],
  'Telangana': ['Hyderabad', 'Secunderabad'],
  'Haryana': ['Gurgaon', 'Faridabad'],
  'Punjab': ['Chandigarh', 'Amritsar'],
};

const VEHICLE_MODELS: Record<string, string[]> = {
  'Maruti': ['Swift', 'Alto', 'WagonR', 'Baleno'],
  'Hyundai': ['Creta', 'i20', 'Venue'],
  'Tata': ['Nexon', 'Tiago', 'Harrier'],
  'Mahindra': ['XUV500', 'Bolero'],
  'Honda': ['City', 'Civic', 'Jazz'],
};

const PROPERTY_TYPES = [
  'Residential House', 'Commercial Building', 'Industrial Warehouse',
  'Office Space', 'Retail Store',
];

const DOCUMENT_TYPES = ['POLICY_SCHEDULE', 'ENDORSEMENT', 'RENEWAL_NOTICE', 'CLAIM_FORM'];
const ENDORSEMENT_TYPES = ['ADDRESS_CHANGE', 'NOMINEE_CHANGE', 'VEHICLE_CHANGE', 'SUM_CHANGE'];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMobileNumber(): string {
  return '9' + String(randomInt(100000000, 999999999)).padStart(9, '0');
}

function generateRegistrationNumber(): string {
  const stateCode = randomElement(['TN', 'KA', 'MH', 'DL', 'UP']);
  const letters = String.fromCharCode(65 + randomInt(0, 25)) + String.fromCharCode(65 + randomInt(0, 25));
  const number = String(randomInt(1000, 9999));
  return `${stateCode}${String(randomInt(1, 26)).padStart(2, '0')}${letters}${number}`;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedAgents() {
  console.log('\n👥 Seeding agents...');
  const agents = [];
  for (let i = 1; i <= 10; i++) {
    agents.push({
      agentCode: `AGT-2026-${String(i).padStart(6, '0')}`,
      agentName: `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`,
      branch: randomElement(STATES),
      mobile: generateMobileNumber(),
      email: `agent${i}@intellipolicy.com`,
      status: 'ACTIVE',
    });
  }
  await Agent.insertMany(agents);
  console.log(`✓ Created ${agents.length} agents`);
  return agents;
}

async function seedCustomersAndPolicies(agents: any[]) {
  console.log('\n📋 Seeding policies with customers...');
  let policyCounter = 0;
  let customerCounter = 0;
  const createdPolicies: any[] = [];

  for (const policyType of POLICY_TYPES) {
    policyCounter++;
    customerCounter++;

    // Create customer
    const state = randomElement(STATES);
    const customer = await Customer.create({
      customerId: `CUST-2026-${String(customerCounter).padStart(6, '0')}`,
      customerType: 'Individual',
      firstName: randomElement(FIRST_NAMES),
      lastName: randomElement(LAST_NAMES),
      dateOfBirth: randomDate(new Date(1960, 0, 1), new Date(2000, 0, 1)),
      gender: randomElement(['Male', 'Female']),
      email: `customer${customerCounter}@example.com`,
      mobile: generateMobileNumber(),
      aadhaarMasked: `XXXX-XXXX-${String(randomInt(1000, 9999))}`,
      panMasked: `XXXXX${String(randomInt(1000, 9999))}F`,
      address: `${randomInt(1, 500)} Main Street`,
      city: randomElement(CITIES[state]),
      state,
      pincode: String(randomInt(100000, 999999)),
    });

    // Create policy
    const agent = randomElement(agents);
    const issueDate = randomDate(new Date(2024, 0, 1), new Date(2025, 0, 1));
    const expiryDate = new Date(issueDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const policy = await Policy.create({
      policyId: `POL-2026-${String(policyCounter).padStart(6, '0')}`,
      policyNumber: `POL-2026-${String(policyCounter).padStart(6, '0')}`,
      customerId: customer.customerId,
      customer: customer._id,
      policyType: policyType as 'Motor' | 'Health' | 'Property' | 'Life' | 'Travel',
      productCode: `PRD-${String(policyCounter).padStart(3, '0')}`,
      insurerName: 'Synergech Insurance',
      issueDate,
      effectiveDate: issueDate,
      expiryDate,
      premiumAmount: randomInt(30000, 150000),
      sumInsured: randomInt(500000, 5000000),
      policyStatus: 'ACTIVE',
      agentCode: agent.agentCode,
      agent: agent._id,
      branchCode: `BR-${String(randomInt(1, 10)).padStart(3, '0')}`,
    });

    // Create coverages
    let coverageCounter = policyCounter * 100;
    for (const coverage of COVERAGES) {
      coverageCounter++;
      await Coverage.create({
        coverageId: `COV-2026-${String(coverageCounter).padStart(6, '0')}`,
        policyId: policy.policyId,
        policy: policy._id,
        coverageCode: coverage.code,
        coverageName: coverage.name,
        coverageLimit: randomInt(300000, 2000000),
        deductible: randomInt(5000, 50000),
        status: 'ACTIVE',
      });
    }

    createdPolicies.push({ policy, customer, policyType });
    console.log(`✓ Created ${policyType} policy: ${policy.policyNumber}`);
  }

  return createdPolicies;
}

async function seedInsuredAssets(createdPolicies: any[]) {
  console.log('\n🚗 Seeding insured assets...');
  let assetCounter = 0;

  for (const { policy, policyType } of createdPolicies) {
    if (policyType === 'Motor') {
      // Create vehicle assets for Motor policies
      const make = randomElement(Object.keys(VEHICLE_MODELS));
      const model = randomElement(VEHICLE_MODELS[make]);

      assetCounter++;
      await InsuredAsset.create({
        assetId: `AST-2026-${String(assetCounter).padStart(6, '0')}`,
        policyId: policy.policyId,
        policy: policy._id,
        assetType: 'FourWheeler',
        registrationNumber: generateRegistrationNumber(),
        chassisNumber: `CH${String(randomInt(100000000, 999999999))}`,
        engineNumber: `EN${String(randomInt(10000000, 99999999))}`,
        make,
        modelName: model,
        manufacturingYear: randomInt(2018, 2024),
        fuelType: randomElement(['Petrol', 'Diesel', 'CNG']),
        marketValue: randomInt(800000, 3000000),
        insuredValue: randomInt(600000, 2500000),
      });
      console.log(`  ✓ Vehicle: ${make} ${model} (${policy.policyNumber})`);
    } else if (policyType === 'Property') {
      // Create property assets for Property policies
      assetCounter++;
      const propertyType = randomElement(PROPERTY_TYPES);
      await InsuredAsset.create({
        assetId: `AST-2026-${String(assetCounter).padStart(6, '0')}`,
        policyId: policy.policyId,
        policy: policy._id,
        assetType: 'Property',
        registrationNumber: `PROP-${randomInt(100000, 999999)}`,
        make: propertyType,
        modelName: `${randomInt(100, 500)} sqft ${propertyType.toLowerCase()}`,
        manufacturingYear: randomInt(2010, 2023),
        marketValue: randomInt(2000000, 10000000),
        insuredValue: randomInt(1500000, 8000000),
      });
      console.log(`  ✓ Property: ${propertyType} (${policy.policyNumber})`);
    }
  }
}

async function seedClaims(createdPolicies: any[]) {
  console.log('\n📝 Seeding claims...');
  let claimCounter = 0;

  for (const { policy, policyType } of createdPolicies) {
    // Create 1-3 claims per policy
    const numClaims = randomInt(1, 3);

    for (let i = 0; i < numClaims; i++) {
      claimCounter++;
      const incidentDate = randomDate(new Date(2024, 0, 1), new Date());
      const settlementDate = Math.random() > 0.4 ? randomDate(incidentDate, new Date()) : null;

      let claimType = 'OWN_DAMAGE';
      let claimAmount = 100000;

      if (policyType === 'Motor') {
        claimType = randomElement(['OWN_DAMAGE', 'THIRD_PARTY', 'THEFT']);
        claimAmount = randomInt(50000, 500000);
      } else if (policyType === 'Health') {
        claimType = 'MEDICAL';
        claimAmount = randomInt(20000, 200000);
      } else if (policyType === 'Property') {
        claimType = randomElement(['FIRE', 'THEFT']);
        claimAmount = randomInt(100000, 1000000);
      } else if (policyType === 'Life') {
        claimType = 'OWN_DAMAGE';
        claimAmount = randomInt(500000, 2000000);
      } else if (policyType === 'Travel') {
        claimType = randomElement(['MEDICAL', 'THEFT']);
        claimAmount = randomInt(10000, 100000);
      }

      await ClaimsHistory.create({
        claimId: `CLM-2026-${String(claimCounter).padStart(6, '0')}`,
        policyId: policy.policyId,
        policy: policy._id,
        claimNumber: `CLM-2026-${String(claimCounter).padStart(6, '0')}`,
        incidentDate,
        settlementDate,
        claimAmount,
        approvedAmount: settlementDate ? Math.floor(claimAmount * randomInt(70, 100) / 100) : 0,
        claimStatus: settlementDate ? 'SETTLED' : randomElement(['PENDING', 'UNDER_REVIEW', 'APPROVED']),
        claimType,
      });
    }
  }
  console.log(`✓ Created ${claimCounter} claims`);
}

async function seedDocuments(createdPolicies: any[]) {
  console.log('\n📄 Seeding policy documents...');
  let docCounter = 0;

  for (const { policy } of createdPolicies) {
    // Create 2-4 documents per policy
    const numDocs = randomInt(2, 4);

    for (let i = 0; i < numDocs; i++) {
      docCounter++;
      const docType = randomElement(DOCUMENT_TYPES);

      await PolicyDocument.create({
        documentId: `DOC-2026-${String(docCounter).padStart(6, '0')}`,
        policyId: policy.policyId,
        policy: policy._id,
        documentType: docType,
        fileName: `${policy.policyNumber}_${docType}.pdf`,
        storagePath: `storage/documents/${policy.policyNumber}/${docType}.pdf`,
        uploadedAt: randomDate(new Date(2024, 0, 1), new Date()),
      });
    }
  }
  console.log(`✓ Created ${docCounter} documents`);
}

async function seedEndorsements(createdPolicies: any[]) {
  console.log('\n📋 Seeding endorsements...');
  let endorsementCounter = 0;

  for (const { policy } of createdPolicies) {
    // Create 0-2 endorsements per policy
    const numEndorsements = randomInt(0, 2);

    for (let i = 0; i < numEndorsements; i++) {
      endorsementCounter++;
      const endorsementDate = randomDate(new Date(2024, 6, 1), new Date());

      await Endorsement.create({
        endorsementId: `END-2026-${String(endorsementCounter).padStart(6, '0')}`,
        policyId: policy.policyId,
        policy: policy._id,
        endorsementType: randomElement(ENDORSEMENT_TYPES),
        endorsementDate,
        effectiveDate: endorsementDate,
        description: `Policy modification for ${policy.policyNumber}`,
      });
    }
  }
  console.log(`✓ Created ${endorsementCounter} endorsements`);
}

async function main() {
  try {
    console.log('🌱 Starting comprehensive sample data migration...');
    console.log('📍 Connecting to:', MONGODB_URI.replace(/:[^@]*@/, ':****@'));
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing collections
    console.log('\n🗑️  Clearing existing data...');
    await Agent.deleteMany({});
    await Customer.deleteMany({});
    await Policy.deleteMany({});
    await Coverage.deleteMany({});
    await InsuredAsset.deleteMany({});
    await ClaimsHistory.deleteMany({});
    await PolicyDocument.deleteMany({});
    await Endorsement.deleteMany({});
    console.log('✓ All collections cleared');

    // Seed data
    const agents = await seedAgents();
    const createdPolicies = await seedCustomersAndPolicies(agents);
    await seedInsuredAssets(createdPolicies);
    await seedClaims(createdPolicies);
    await seedDocuments(createdPolicies);
    await seedEndorsements(createdPolicies);

    console.log('\n✅ Sample data migration completed successfully!');
    console.log(`
📊 Summary:
  - Agents: 10
  - Policies: 5 (Motor, Health, Property, Life, Travel)
  - Customers: 5
  - Coverages: 25 (5 per policy)
  - Documents: ${randomInt(10, 20)}
  - Claims: ${randomInt(5, 15)}
  - Endorsements: ${randomInt(0, 10)}
    `);

    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
