import mongoose, { Schema, Document } from 'mongoose';

export interface IRequiredDocument {
  documentCode: string;
  documentName: string;
  isMandatory: boolean;
  description?: string;
}

export interface IClaimDocumentRule extends Document {
  ruleId: string;
  claimType: string;
  policyType?: string;
  requiredDocuments: IRequiredDocument[];
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const RequiredDocumentSchema = new Schema<IRequiredDocument>(
  {
    documentCode: { type: String, required: true },
    documentName: { type: String, required: true },
    isMandatory: { type: Boolean, default: true },
    description: { type: String },
  },
  { _id: false }
);

const ClaimDocumentRuleSchema = new Schema<IClaimDocumentRule>(
  {
    ruleId: { type: String, required: true, unique: true, index: true },
    claimType: { type: String, required: true, index: true },
    policyType: { type: String, index: true },
    requiredDocuments: { type: [RequiredDocumentSchema], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

ClaimDocumentRuleSchema.index({ claimType: 1, policyType: 1 }, { unique: false });

export default mongoose.models.ClaimDocumentRule ||
  mongoose.model<IClaimDocumentRule>('ClaimDocumentRule', ClaimDocumentRuleSchema, 'claimDocumentRules');
