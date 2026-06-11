import mongoose, { Document, Schema } from 'mongoose';

export interface IEndorsement extends Document {
  endorsementId: string;
  policyId: string;
  policy?: mongoose.Types.ObjectId;
  endorsementType: 'ADDRESS_CHANGE' | 'NOMINEE_CHANGE' | 'VEHICLE_CHANGE' | 'SUM_CHANGE';
  endorsementDate: Date;
  effectiveDate: Date;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const EndorsementSchema = new Schema<IEndorsement>(
  {
    endorsementId: { type: String, required: true, unique: true, index: true },
    policyId: { type: String, required: true, index: true },
    policy: { type: Schema.Types.ObjectId, ref: 'Policy' },
    endorsementType: {
      type: String,
      enum: ['ADDRESS_CHANGE', 'NOMINEE_CHANGE', 'VEHICLE_CHANGE', 'SUM_CHANGE'],
      required: true,
    },
    endorsementDate: { type: Date, required: true },
    effectiveDate: { type: Date, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Endorsement || mongoose.model('Endorsement', EndorsementSchema, 'endorsements');
