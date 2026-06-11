import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Agent from '../models/Agent';
import Customer from '../models/Customer';
import Policy from '../models/Policy';
import Coverage from '../models/Coverage';
import InsuredAsset from '../models/InsuredAsset';
import ClaimsHistory from '../models/Claim';
import PolicyDocument from '../models/PolicyDocument';
import Endorsement from '../models/Endorsement';
import User from '../models/User';
import AuditLog from '../models/AuditLog';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intellipolicy';
const BACKUP_DIR = path.join(__dirname, 'backup');

async function backupCollection(name: string, model: any) {
  try {
    console.log(`Backing up ${name}...`);
    const data = await model.find({}).lean();
    const filename = path.join(BACKUP_DIR, `${name.toLowerCase()}.json`);
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`✓ Backed up ${data.length} ${name} records to ${filename}`);
    return data.length;
  } catch (error) {
    console.error(`✗ Failed to backup ${name}:`, error);
    return 0;
  }
}

async function main() {
  try {
    console.log('🔄 Starting database backup...');

    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      console.log(`✓ Created backup directory: ${BACKUP_DIR}`);
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const stats = {
      agents: await backupCollection('Agent', Agent),
      customers: await backupCollection('Customer', Customer),
      policies: await backupCollection('Policy', Policy),
      coverages: await backupCollection('Coverage', Coverage),
      insuredAssets: await backupCollection('InsuredAsset', InsuredAsset),
      claimsHistory: await backupCollection('ClaimsHistory', ClaimsHistory),
      policyDocuments: await backupCollection('PolicyDocument', PolicyDocument),
      endorsements: await backupCollection('Endorsement', Endorsement),
      users: await backupCollection('User', User),
      auditLogs: await backupCollection('AuditLog', AuditLog),
    };

    console.log('\n✅ Backup completed successfully!');
    console.log(`\nBackup summary:
      - Agents: ${stats.agents}
      - Customers: ${stats.customers}
      - Policies: ${stats.policies}
      - Coverages: ${stats.coverages}
      - Insured Assets: ${stats.insuredAssets}
      - Claims History: ${stats.claimsHistory}
      - Policy Documents: ${stats.policyDocuments}
      - Endorsements: ${stats.endorsements}
      - Users: ${stats.users}
      - Audit Logs: ${stats.auditLogs}
    `);

    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

main();
