import mongoose, { Schema, Document } from 'mongoose';

export type ClaimStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'UNDER_REVIEW'
  | 'SETTLED';

export type WorkflowStatus =
  | 'FNOL_RECEIVED'
  | 'VALIDATED'
  | 'CLAIM_REGISTERED'
  | 'DOCUMENTS_PENDING'
  | 'DOCUMENTS_RECEIVED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SETTLED';

export type ClaimType = 'OWN_DAMAGE' | 'THIRD_PARTY' | 'THEFT' | 'MEDICAL' | 'FIRE' | 'PROPERTY_DAMAGE' | 'NATURAL_DISASTER';

export interface ISettlementDetails {
  settlementAmount: number;
  settlementMode: string;
  settlementDate: Date;
  bankAccount?: string;
  remarks?: string;
}

export interface IClaimsHistory extends Document {
  claimId: string;
  policyId: string;
  policy?: mongoose.Types.ObjectId;
  claimNumber: string;
  fnolId?: string;
  fnolNumber?: string;
  incidentDate: Date;
  settlementDate?: Date;
  claimAmount: number;
  approvedAmount: number;
  claimStatus: ClaimStatus;
  workflowStatus: WorkflowStatus;
  claimType: ClaimType;
  vehicleNumber?: string;
  description?: string;
  incidentLocation?: string;
  fraudFlags: string[];
  isFraudulent: boolean;
  settlementDetails?: ISettlementDetails;
  assignedTo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettlementDetailsSchema = new Schema<ISettlementDetails>(
  {
    settlementAmount: { type: Number, required: true },
    settlementMode: { type: String, required: true },
    settlementDate: { type: Date, required: true },
    bankAccount: { type: String },
    remarks: { type: String },
  },
  { _id: false }
);

const ClaimsHistorySchema = new Schema<IClaimsHistory>(
  {
    claimId: { type: String, required: true, unique: true, index: true },
    policyId: { type: String, required: true, index: true },
    policy: { type: Schema.Types.ObjectId, ref: 'Policy' },
    claimNumber: { type: String, required: true, unique: true, index: true },
    fnolId: { type: String, index: true },
    fnolNumber: { type: String, index: true },
    incidentDate: { type: Date, required: true },
    settlementDate: { type: Date },
    claimAmount: { type: Number, required: true },
    approvedAmount: { type: Number, default: 0 },
    claimStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW', 'SETTLED'],
      default: 'PENDING',
      index: true,
    },
    workflowStatus: {
      type: String,
      enum: [
        'FNOL_RECEIVED',
        'VALIDATED',
        'CLAIM_REGISTERED',
        'DOCUMENTS_PENDING',
        'DOCUMENTS_RECEIVED',
        'UNDER_REVIEW',
        'APPROVED',
        'REJECTED',
        'SETTLED',
      ],
      default: 'CLAIM_REGISTERED',
      index: true,
    },
    claimType: {
      type: String,
      enum: ['OWN_DAMAGE', 'THIRD_PARTY', 'THEFT', 'MEDICAL', 'FIRE', 'PROPERTY_DAMAGE', 'NATURAL_DISASTER'],
      required: true,
    },
    vehicleNumber: { type: String, index: true },
    description: { type: String },
    incidentLocation: { type: String },
    fraudFlags: { type: [String], default: [] },
    isFraudulent: { type: Boolean, default: false },
    settlementDetails: { type: SettlementDetailsSchema },
    assignedTo: { type: String, index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.ClaimsHistory ||
  mongoose.model<IClaimsHistory>('ClaimsHistory', ClaimsHistorySchema, 'ClaimsHistory');
