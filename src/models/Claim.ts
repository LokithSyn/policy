import mongoose, { Schema, Document } from 'mongoose';

export interface IClaimsHistory extends Document {
  claimId: string;
  policyId: string;
  policy?: mongoose.Types.ObjectId;
  claimNumber: string;
  incidentDate: Date;
  settlementDate?: Date;
  claimAmount: number;
  approvedAmount: number;
  claimStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW' | 'SETTLED';
  claimType: 'OWN_DAMAGE' | 'THIRD_PARTY' | 'THEFT' | 'MEDICAL' | 'FIRE';
  createdAt: Date;
  updatedAt: Date;
}

const ClaimsHistorySchema = new Schema<IClaimsHistory>(
  {
    claimId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    policyId: {
      type: String,
      required: true,
      index: true,
    },
    policy: {
      type: Schema.Types.ObjectId,
      ref: 'Policy',
    },
    claimNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    incidentDate: {
      type: Date,
      required: true,
    },
    settlementDate: {
      type: Date,
    },
    claimAmount: {
      type: Number,
      required: true,
    },
    approvedAmount: {
      type: Number,
      default: 0,
    },
    claimStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW', 'SETTLED'],
      default: 'PENDING',
      index: true,
    },
    claimType: {
      type: String,
      enum: ['OWN_DAMAGE', 'THIRD_PARTY', 'THEFT', 'MEDICAL', 'FIRE'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ClaimsHistory || mongoose.model<IClaimsHistory>('ClaimsHistory', ClaimsHistorySchema, 'claimshistories');
