import mongoose, { Schema, Document } from 'mongoose';

export interface IClaim extends Document {
  claimNumber: string;
  policyNumber: string;
  memberName: string;
  hospitalName: string;
  claimAmount: number;
  approvedAmount: number;
  claimDate: Date;
  admissionDate: Date;
  dischargeDate: Date;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Under Review';
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClaimSchema = new Schema<IClaim>(
  {
    claimNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    policyNumber: {
      type: String,
      required: true,
      index: true,
    },
    memberName: {
      type: String,
      required: true,
    },
    hospitalName: {
      type: String,
      required: true,
    },
    claimAmount: {
      type: Number,
      required: true,
    },
    approvedAmount: {
      type: Number,
      default: 0,
    },
    claimDate: {
      type: Date,
      default: Date.now,
    },
    admissionDate: {
      type: Date,
      required: true,
    },
    dischargeDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Under Review'],
      default: 'Pending',
      index: true,
    },
    reason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Claim || mongoose.model<IClaim>('Claim', ClaimSchema);
