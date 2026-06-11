import mongoose, { Schema, Document } from 'mongoose';

export interface IPolicy extends Document {
  policyId: string;
  policyNumber: string;
  customerId: string;
  customer?: mongoose.Types.ObjectId;
  policyType: 'Motor' | 'Health' | 'Property' | 'Life' | 'Travel';
  productCode: string;
  insurerName: string;
  issueDate: Date;
  effectiveDate: Date;
  expiryDate: Date;
  premiumAmount: number;
  sumInsured: number;
  policyStatus: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';
  agentCode?: string;
  agent?: mongoose.Types.ObjectId;
  branchCode?: string;
  renewalPolicyNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PolicySchema = new Schema<IPolicy>(
  {
    policyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    policyNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    policyType: {
      type: String,
      enum: ['Motor', 'Health', 'Property', 'Life', 'Travel'],
      required: true,
    },
    productCode: {
      type: String,
      required: true,
    },
    insurerName: {
      type: String,
      required: true,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    effectiveDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    premiumAmount: {
      type: Number,
      required: true,
    },
    sumInsured: {
      type: Number,
      required: true,
    },
    policyStatus: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    agentCode: {
      type: String,
      index: true,
    },
    agent: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
    },
    branchCode: {
      type: String,
    },
    renewalPolicyNumber: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Policy || mongoose.model<IPolicy>('Policy', PolicySchema, 'Policy');
