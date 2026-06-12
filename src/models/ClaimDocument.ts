import mongoose, { Schema, Document } from 'mongoose';

export type DocumentStatus = 'PENDING' | 'RECEIVED' | 'VERIFIED' | 'REJECTED';

export interface IClaimDocument extends Document {
  documentId: string;
  claimId: string;
  claim?: mongoose.Types.ObjectId;
  documentType: string;
  fileName: string;
  storagePath: string;
  fileSize?: number;
  mimeType?: string;
  status: DocumentStatus;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  uploadedBy?: string;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ClaimDocumentSchema = new Schema<IClaimDocument>(
  {
    documentId: { type: String, required: true, unique: true, index: true },
    claimId: { type: String, required: true, index: true },
    claim: { type: Schema.Types.ObjectId, ref: 'ClaimsHistory' },
    documentType: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    storagePath: { type: String, required: true },
    fileSize: { type: Number },
    mimeType: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'RECEIVED', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    verifiedBy: { type: String },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
    uploadedBy: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.ClaimDocument ||
  mongoose.model<IClaimDocument>('ClaimDocument', ClaimDocumentSchema, 'claimDocuments');
