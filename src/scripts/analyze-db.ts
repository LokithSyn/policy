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
import User from '../models/User';
import AuditLog from '../models/AuditLog';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intellipolicy';

interface CollectionInfo {
  name: string;
  count: number;
  sample?: any;
}

async function analyzeCollection(name: string, model: any): Promise<CollectionInfo> {
  try {
    const count = await model.countDocuments({});
    const sample = await model.findOne({}).lean();
    return { name, count, sample };
  } catch (error) {
    console.error(`Error analyzing ${name}:`, error);
    return { name, count: 0, sample: null };
  }
}

async function main() {
  try {
    console.log('📊 Analyzing MongoDB database...\n');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const collections = await Promise.all([
      analyzeCollection('Agent', Agent),
      analyzeCollection('Customer', Customer),
      analyzeCollection('Policy', Policy),
      analyzeCollection('Coverage', Coverage),
      analyzeCollection('InsuredAsset', InsuredAsset),
      analyzeCollection('ClaimsHistory', ClaimsHistory),
      analyzeCollection('PolicyDocument', PolicyDocument),
      analyzeCollection('Endorsement', Endorsement),
      analyzeCollection('User', User),
      analyzeCollection('AuditLog', AuditLog),
    ]);

    const report = {
      timestamp: new Date().toISOString(),
      uri: MONGODB_URI,
      collections: collections.map((c) => ({
        name: c.name,
        documentCount: c.count,
        sampleDocument: c.sample,
      })),
    };

    console.log(JSON.stringify(report, null, 2));

    console.log('\n✅ Analysis completed successfully!');
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

main();
