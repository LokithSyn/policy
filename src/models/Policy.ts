import mongoose, { Schema, Document } from 'mongoose';

export interface IPolicy extends Document {
  policyNumber: string;
  memberId: string;
  memberName: string;
  dob: Date;
  gender: 'Male' | 'Female' | 'Other';
  email: string;
  phone: string;
  policyType: 'Individual' | 'Family Floater' | 'Corporate';
  sumInsured: number;
  deductible: number;
  coPay: number;
  startDate: Date;
  endDate: Date;
  status: 'Active' | 'Expired' | 'Suspended';
  createdAt: Date;
  updatedAt: Date;
}

const PolicySchema = new Schema<IPolicy>(
  {
    policyNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    memberId: {
      type: String,
      required: true,
      index: true,
    },
    memberName: {
      type: String,
      required: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    policyType: {
      type: String,
      enum: ['Individual', 'Family Floater', 'Corporate'],
      required: true,
    },
    sumInsured: {
      type: Number,
      required: true,
    },
    deductible: {
      type: Number,
      default: 0,
    },
    coPay: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Expired', 'Suspended'],
      default: 'Active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Policy || mongoose.model<IPolicy>('Policy', PolicySchema);
