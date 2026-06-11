import mongoose, { Document, Schema } from 'mongoose';

export interface IPolicyDocument extends Document {
  documentId: string;
  policyId: string;
  policy?: mongoose.Types.ObjectId;
  documentType: 'POLICY_SCHEDULE' | 'ENDORSEMENT' | 'RENEWAL_NOTICE' | 'CLAIM_FORM';
  fileName: string;
  storagePath: string;
  uploadedAt: Date;
}

const PolicyDocumentSchema = new Schema<IPolicyDocument>(
  {
    documentId: { type: String, required: true, unique: true, index: true },
    policyId: { type: String, required: true, index: true },
    policy: { type: Schema.Types.ObjectId, ref: 'Policy' },
    documentType: {
      type: String,
      enum: ['POLICY_SCHEDULE', 'ENDORSEMENT', 'RENEWAL_NOTICE', 'CLAIM_FORM'],
      required: true,
    },
    fileName: { type: String, required: true },
    storagePath: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export default mongoose.models.PolicyDocument || mongoose.model('PolicyDocument', PolicyDocumentSchema, 'PolicyDocument');
