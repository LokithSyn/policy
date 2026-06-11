import mongoose, { Document, Schema } from 'mongoose';

export interface ICoverage extends Document {
  coverageId: string;
  policyId: string;
  policy?: mongoose.Types.ObjectId;
  coverageCode: string;
  coverageName: string;
  coverageLimit: number;
  deductible: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const CoverageSchema = new Schema<ICoverage>(
  {
    coverageId: { type: String, required: true, unique: true, index: true },
    policyId: { type: String, required: true, index: true },
    policy: { type: Schema.Types.ObjectId, ref: 'Policy' },
    coverageCode: { type: String, required: true },
    coverageName: { type: String, required: true },
    coverageLimit: { type: Number, required: true },
    deductible: { type: Number, default: 0 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export default mongoose.models.Coverage || mongoose.model('Coverage', CoverageSchema, 'Coverage');
