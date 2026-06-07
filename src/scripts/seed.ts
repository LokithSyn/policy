import mongoose from 'mongoose';
import Policy from '../models/Policy.ts';
import Claim from '../models/Claim.ts';
import User from '../models/User.ts';
import AuditLog from '../models/AuditLog.ts';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intellipolicy';

const HOSPITALS = [
  'Apollo Hospital',
  'Fortis Healthcare',
  'Max Healthcare',
  'Manipal Hospital',
  'Medanta',
  'Safdarjung Hospital',
  'AIIMS Delhi',
  'Asian Hospital',
  'Hinduja Hospital',
  'Lilavati Hospital',
];

const POLICY_TYPES = ['Individual', 'Family Floater', 'Corporate'];
const STATUSES = ['Active', 'Expired', 'Suspended'];
const CLAIM_STATUSES = ['Pending', 'Approved', 'Rejected', 'Under Review'];

function generatePolicyNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000);
  return `POL-${year}-${String(random).padStart(6, '0')}`;
}

function generateClaimNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000);
  return `CLM-${year}-${String(random).padStart(6, '0')}`;
}

function generateMemberId() {
  const random = Math.floor(Math.random() * 1000000);
  return `MEM-${String(random).padStart(8, '0')}`;
}

function randomDate(start: Date, end: Date) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const FIRST_NAMES = [
  'Rajesh', 'Priya', 'Amit', 'Neha', 'Arjun', 'Swati', 'Rohan', 'Divya',
  'Vikram', 'Anjali', 'Arun', 'Pooja', 'Sanjeev', 'Kavya', 'Nitin', 'Isha'
];

const LAST_NAMES = [
  'Kumar', 'Singh', 'Patel', 'Sharma', 'Gupta', 'Verma', 'Joshi', 'Iyer',
  'Menon', 'Rao', 'Bhat', 'Sinha', 'Desai', 'Mishra', 'Nair', 'Yadav'
];

function generateName() {
  return `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`;
}

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      Policy.deleteMany({}),
      Claim.deleteMany({}),
      User.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    // Create sample users
    console.log('Creating sample users...');
    const userRoles = ['Administrator', 'Claims Processor', 'Read Only Auditor'];
    const users = await User.insertMany(
      [...Array(50)].map((_, i) => ({
        auth0Id: `auth0|${i}`,
        email: `user${i}@example.com`,
        name: generateName(),
        role: randomElement(userRoles),
        organization: 'IntelliDoc',
        lastLogin: randomDate(
          new Date('2024-01-01'),
          new Date()
        ),
      }))
    );
    console.log(`Created ${users.length} users`);

    // Create sample policies
    console.log('Creating sample policies...');
    const policies = await Policy.insertMany(
      [...Array(100)].map(() => {
        const startDate = randomDate(
          new Date('2023-01-01'),
          new Date('2024-01-01')
        );
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);

        return {
          policyNumber: generatePolicyNumber(),
          memberId: generateMemberId(),
          memberName: generateName(),
          dob: randomDate(
            new Date('1960-01-01'),
            new Date('2005-12-31')
          ),
          gender: randomElement(['Male', 'Female', 'Other']),
          email: `member${Math.random()}@example.com`,
          phone: `+91${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
          policyType: randomElement(POLICY_TYPES),
          sumInsured: randomElement([100000, 300000, 500000, 1000000, 2000000]),
          deductible: randomElement([0, 5000, 10000]),
          coPay: randomElement([0, 10, 15, 20]),
          startDate,
          endDate,
          status: randomElement(STATUSES),
        };
      })
    );
    console.log(`Created ${policies.length} policies`);

    // Create sample claims
    console.log('Creating sample claims...');
    const claims = await Claim.insertMany(
      [...Array(200)].map(() => {
        const admissionDate = randomDate(
          new Date('2024-01-01'),
          new Date()
        );
        const dischargeDate = new Date(admissionDate);
        dischargeDate.setDate(dischargeDate.getDate() + Math.floor(Math.random() * 10));

        const claimAmount = randomElement([
          10000, 25000, 50000, 75000, 100000, 150000, 200000, 250000,
        ]);

        return {
          claimNumber: generateClaimNumber(),
          policyNumber: randomElement(policies.map(p => p.policyNumber)),
          memberName: generateName(),
          hospitalName: randomElement(HOSPITALS),
          claimAmount,
          approvedAmount: Math.floor(claimAmount * (0.7 + Math.random() * 0.3)),
          claimDate: new Date(),
          admissionDate,
          dischargeDate,
          status: randomElement(CLAIM_STATUSES),
          reason: randomElement(CLAIM_STATUSES) === 'Rejected'
            ? 'Pre-existing condition not covered'
            : undefined,
        };
      })
    );
    console.log(`Created ${claims.length} claims`);

    // Create sample audit logs
    console.log('Creating sample audit logs...');
    const auditLogs = await AuditLog.insertMany(
      [...Array(100)].map(() => ({
        userId: randomElement(users.map(u => u._id.toString())),
        action: randomElement(['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'VERIFY']),
        entity: randomElement(['Policy', 'Claim']),
        entityId: randomElement([
          ...policies.map(p => p._id.toString()),
          ...claims.map(c => c._id.toString()),
        ]),
        timestamp: randomDate(
          new Date('2024-01-01'),
          new Date()
        ),
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      }))
    );
    console.log(`Created ${auditLogs.length} audit logs`);

    console.log('✅ Seed data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seed();
