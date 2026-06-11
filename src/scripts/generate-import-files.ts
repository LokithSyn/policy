import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIRST_NAMES = [
  'Rajesh', 'Amit', 'Vikram', 'Arjun', 'Deepak', 'Sanjay', 'Anil', 'Manoj',
  'Priya', 'Neha', 'Anjali', 'Divya', 'Aisha', 'Rani', 'Pooja', 'Shreya',
  'Aryan', 'Nikhil', 'Rohan', 'Varun', 'Akshay', 'Abhishek', 'Karan', 'Harsh',
  'Fatima', 'Meera',
];

const LAST_NAMES = [
  'Kumar', 'Singh', 'Patel', 'Sharma', 'Gupta', 'Verma', 'Rao', 'Nair',
  'Desai', 'Pillai', 'Reddy', 'Bhat', 'Chopra', 'Mishra', 'Khan', 'Ahmed',
  'Mehta', 'Bansal', 'Agarwal', 'Joshi', 'Iyer', 'Saxena', 'Goyal', 'Kapoor',
  'Malhotra', 'Srivastava',
];

const STATES = [
  'Tamil Nadu', 'Karnataka', 'Maharashtra', 'Delhi', 'Uttar Pradesh',
  'Rajasthan', 'Gujarat', 'Telangana', 'Haryana', 'Punjab',
];

const CITIES: Record<string, string[]> = {
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Aurangabad'],
  'Delhi': ['New Delhi', 'Delhi', 'Dwarka'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Bikaner'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
  'Telangana': ['Hyderabad', 'Secunderabad', 'Warangal'],
  'Haryana': ['Gurgaon', 'Faridabad', 'Hisar'],
  'Punjab': ['Chandigarh', 'Amritsar', 'Ludhiana'],
};

const INSURERS = [
  'New India Assurance', 'HDFC ERGO', 'Bajaj Allianz', 'ICICI Lombard',
  'National Insurance', 'Oriental Insurance', 'United India Insurance',
  'Aviva Life Insurance', 'TATA AIG', 'Reliance General Insurance',
];

const VEHICLE_MODELS: Record<string, string[]> = {
  'Maruti': ['Swift', 'Alto', 'WagonR', 'Baleno', 'Celerio'],
  'Hyundai': ['Creta', 'i20', 'Venue', 'Aura'],
  'Tata': ['Nexon', 'Tiago', 'Harrier', 'Safari'],
  'Mahindra': ['XUV500', 'Bolero', 'KUV100', 'Scorpio'],
  'Honda': ['City', 'Civic', 'CR-V', 'Jazz'],
  'Toyota': ['Innova', 'Fortuner', 'Altis'],
  'Renault': ['Kiger', 'Duster'],
  'Skoda': ['Rapid', 'Superb'],
  'Volkswagen': ['Polo', 'Vento'],
  'Nissan': ['Magnite', 'Kicks'],
  'Kia': ['Seltos', 'Sonet'],
};

const POLICY_TYPES = ['Motor', 'Health', 'Property', 'Life', 'Travel'];
const COVERAGE_CODES = ['OD', 'TP', 'PA', 'MED', 'LL', 'PL'];
const COVERAGE_NAMES: Record<string, string> = {
  'OD': 'Own Damage',
  'TP': 'Third Party Liability',
  'PA': 'Personal Accident',
  'MED': 'Medical Coverage',
  'LL': 'Loss of Life',
  'PL': 'Property Loss',
};

const CLAIM_TYPES = ['OWN_DAMAGE', 'THIRD_PARTY', 'THEFT', 'MEDICAL', 'FIRE'];
const DOCUMENT_TYPES = ['POLICY_SCHEDULE', 'ENDORSEMENT', 'RENEWAL_NOTICE', 'CLAIM_FORM'];
const ENDORSEMENT_TYPES = ['ADDRESS_CHANGE', 'NOMINEE_CHANGE', 'VEHICLE_CHANGE', 'SUM_CHANGE'];

let agentCounter = 0;
let customerCounter = 0;
let policyCounter = 0;
let assetCounter = 0;
let coverageCounter = 0;
let claimCounter = 0;
let docCounter = 0;
let endorsementCounter = 0;

function generateId(prefix: string, counter: number): string {
  return `${prefix}-2026-${String(counter).padStart(6, '0')}`;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

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
  const stateCode = randomElement(['TN', 'KA', 'MH', 'DL', 'UP', 'RJ', 'GJ', 'TG', 'HR', 'PB']);
  const rtoCode = randomInt(1, 26);
  const letters = String.fromCharCode(65 + randomInt(0, 25)) + String.fromCharCode(65 + randomInt(0, 25));
  const number = String(randomInt(1000, 9999));
  return `${stateCode}${String(rtoCode).padStart(2, '0')}${letters}${number}`;
}

function generateAgents() {
  const agents = [];
  for (let i = 0; i < 20; i++) {
    agentCounter++;
    agents.push({
      agentCode: generateId('AGT', agentCounter),
      agentName: `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`,
      branch: randomElement(STATES),
      mobile: generateMobileNumber(),
      email: `agent${i}@intellipolicy.com`,
      status: Math.random() > 0.1 ? 'ACTIVE' : 'INACTIVE',
    });
  }
  return agents;
}

function generateCustomers() {
  const customers = [];
  for (let i = 0; i < 500; i++) {
    customerCounter++;
    const state = randomElement(STATES);
    customers.push({
      customerId: generateId('CUST', customerCounter),
      customerType: Math.random() > 0.9 ? 'Corporate' : 'Individual',
      firstName: randomElement(FIRST_NAMES),
      lastName: randomElement(LAST_NAMES),
      dateOfBirth: randomDate(new Date(1950, 0, 1), new Date(2000, 0, 1)).toISOString(),
      gender: randomElement(['Male', 'Female', 'Other']),
      email: `customer${i}@example.com`,
      mobile: generateMobileNumber(),
      aadhaarMasked: `XXXX-XXXX-${String(randomInt(1000, 9999))}`,
      panMasked: `XXXXX${String(randomInt(1000, 9999))}F`,
      address: `${randomInt(1, 500)} Main Street`,
      city: randomElement(CITIES[state]),
      state,
      pincode: String(randomInt(100000, 999999)),
    });
  }
  return customers;
}

function generatePolicies(customers: any[], agents: any[]) {
  const policies = [];
  for (let i = 0; i < 1000; i++) {
    policyCounter++;
    const customer = randomElement(customers);
    const agent = randomElement(agents);
    const issueDate = randomDate(new Date(2023, 0, 1), new Date(2025, 0, 1));
    const expiryDate = new Date(issueDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    policies.push({
      policyId: generateId('POL', policyCounter),
      policyNumber: generateId('POL', policyCounter),
      customerId: customer.customerId,
      policyType: randomElement(POLICY_TYPES),
      productCode: `PRD-${randomInt(100, 999)}`,
      insurerName: randomElement(INSURERS),
      issueDate: issueDate.toISOString(),
      effectiveDate: issueDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      premiumAmount: randomInt(10000, 100000),
      sumInsured: randomInt(500000, 2500000),
      policyStatus: Math.random() > 0.2 ? 'ACTIVE' : randomElement(['EXPIRED', 'CANCELLED', 'SUSPENDED']),
      agentCode: agent.agentCode,
      branchCode: `BR-${String(randomInt(1, 50)).padStart(3, '0')}`,
    });
  }
  return policies;
}

function generateAssets(policies: any[]) {
  const assets = [];
  for (let i = 0; i < 800; i++) {
    assetCounter++;
    const policy = randomElement(policies);
    const makes = Object.keys(VEHICLE_MODELS);
    const make = randomElement(makes);
    const modelName = randomElement(VEHICLE_MODELS[make]);

    assets.push({
      assetId: generateId('AST', assetCounter),
      policyId: policy.policyId,
      assetType: randomElement(['TwoWheeler', 'FourWheeler', 'Commercial', 'Property']),
      registrationNumber: generateRegistrationNumber(),
      chassisNumber: `CH${String(randomInt(100000000, 999999999))}`,
      engineNumber: `EN${String(randomInt(10000000, 99999999))}`,
      make,
      modelName,
      manufacturingYear: randomInt(2015, 2024),
      fuelType: randomElement(['Petrol', 'Diesel', 'CNG', 'Electric']),
      marketValue: randomInt(500000, 2000000),
      insuredValue: randomInt(300000, 1500000),
    });
  }
  return assets;
}

function generateCoverages(policies: any[]) {
  const coverages = [];
  for (let i = 0; i < 1500; i++) {
    coverageCounter++;
    const policy = randomElement(policies);
    const coverageCode = randomElement(COVERAGE_CODES);

    coverages.push({
      coverageId: generateId('COV', coverageCounter),
      policyId: policy.policyId,
      coverageCode,
      coverageName: COVERAGE_NAMES[coverageCode],
      coverageLimit: randomInt(100000, 2000000),
      deductible: randomInt(0, 50000),
      status: Math.random() > 0.1 ? 'ACTIVE' : 'INACTIVE',
    });
  }
  return coverages;
}

function generateClaims(policies: any[]) {
  const claims = [];
  for (let i = 0; i < 300; i++) {
    claimCounter++;
    const policy = randomElement(policies);
    const incidentDate = randomDate(new Date(2023, 0, 1), new Date());

    claims.push({
      claimId: generateId('CLM', claimCounter),
      policyId: policy.policyId,
      claimNumber: generateId('CLM', claimCounter),
      incidentDate: incidentDate.toISOString(),
      settlementDate: Math.random() > 0.3 ? randomDate(incidentDate, new Date()).toISOString() : null,
      claimAmount: randomInt(50000, 500000),
      approvedAmount: randomInt(0, 500000),
      claimStatus: randomElement(['PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW', 'SETTLED']),
      claimType: randomElement(CLAIM_TYPES),
    });
  }
  return claims;
}

function generateDocuments(policies: any[]) {
  const documents = [];
  for (let i = 0; i < 500; i++) {
    docCounter++;
    const policy = randomElement(policies);
    const docType = randomElement(DOCUMENT_TYPES);

    documents.push({
      documentId: generateId('DOC', docCounter),
      policyId: policy.policyId,
      documentType: docType,
      fileName: `${policy.policyId}_${docType}.pdf`,
      storagePath: `storage/documents/${policy.policyId}/${docType}.pdf`,
      uploadedAt: new Date().toISOString(),
    });
  }
  return documents;
}

function generateEndorsements(policies: any[]) {
  const endorsements = [];
  for (let i = 0; i < 200; i++) {
    endorsementCounter++;
    const policy = randomElement(policies);
    const endorsementDate = randomDate(new Date(2023, 0, 1), new Date());

    endorsements.push({
      endorsementId: generateId('END', endorsementCounter),
      policyId: policy.policyId,
      endorsementType: randomElement(ENDORSEMENT_TYPES),
      endorsementDate: endorsementDate.toISOString(),
      effectiveDate: endorsementDate.toISOString(),
      description: 'Policy modification',
    });
  }
  return endorsements;
}

function main() {
  const outputDir = path.join(__dirname, 'mongodb-import');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('📝 Generating import files...\n');

  const agents = generateAgents();
  fs.writeFileSync(path.join(outputDir, 'agents.json'), JSON.stringify(agents, null, 2));
  console.log(`✓ agents.json - ${agents.length} records`);

  const customers = generateCustomers();
  fs.writeFileSync(path.join(outputDir, 'customers.json'), JSON.stringify(customers, null, 2));
  console.log(`✓ customers.json - ${customers.length} records`);

  const policies = generatePolicies(customers, agents);
  fs.writeFileSync(path.join(outputDir, 'policies.json'), JSON.stringify(policies, null, 2));
  console.log(`✓ policies.json - ${policies.length} records`);

  const assets = generateAssets(policies);
  fs.writeFileSync(path.join(outputDir, 'insuredAssets.json'), JSON.stringify(assets, null, 2));
  console.log(`✓ insuredAssets.json - ${assets.length} records`);

  const coverages = generateCoverages(policies);
  fs.writeFileSync(path.join(outputDir, 'coverages.json'), JSON.stringify(coverages, null, 2));
  console.log(`✓ coverages.json - ${coverages.length} records`);

  const claims = generateClaims(policies);
  fs.writeFileSync(path.join(outputDir, 'claimsHistory.json'), JSON.stringify(claims, null, 2));
  console.log(`✓ claimsHistory.json - ${claims.length} records`);

  const documents = generateDocuments(policies);
  fs.writeFileSync(path.join(outputDir, 'policyDocuments.json'), JSON.stringify(documents, null, 2));
  console.log(`✓ policyDocuments.json - ${documents.length} records`);

  const endorsements = generateEndorsements(policies);
  fs.writeFileSync(path.join(outputDir, 'endorsements.json'), JSON.stringify(endorsements, null, 2));
  console.log(`✓ endorsements.json - ${endorsements.length} records`);

  console.log(`\n✅ All files generated in: ${outputDir}`);
  console.log('\n📥 Import instructions:');
  console.log('1. Open MongoDB Compass');
  console.log('2. Connect to policy.6moaurz.mongodb.net');
  console.log('3. Go to intellipolicy database');
  console.log('4. Click "+ Create collection" for each collection:');
  console.log('   - Agent, Customer, Policy, Coverage, InsuredAsset, ClaimsHistory, PolicyDocument, Endorsement');
  console.log('5. For each collection, click "+" → "Import data" → select the JSON file from mongodb-import folder');
}

main();
