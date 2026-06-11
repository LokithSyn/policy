import mongoose, { Document, Schema } from 'mongoose';

export interface IInsuredAsset extends Document {
  assetId: string;
  policyId: string;
  policy?: mongoose.Types.ObjectId;
  assetType: 'TwoWheeler' | 'FourWheeler' | 'Commercial' | 'Property';
  registrationNumber: string;
  chassisNumber: string;
  engineNumber: string;
  make: string;
  modelName: string;
  manufacturingYear: number;
  fuelType: 'Petrol' | 'Diesel' | 'CNG' | 'Electric';
  marketValue: number;
  insuredValue: number;
  createdAt: Date;
}

const InsuredAssetSchema = new Schema<IInsuredAsset>(
  {
    assetId: { type: String, required: true, unique: true, index: true },
    policyId: { type: String, required: true, index: true },
    policy: { type: Schema.Types.ObjectId, ref: 'Policy' },
    assetType: {
      type: String,
      enum: ['TwoWheeler', 'FourWheeler', 'Commercial', 'Property'],
      required: true,
    },
    registrationNumber: { type: String, index: true },
    chassisNumber: { type: String, index: true },
    engineNumber: { type: String },
    make: { type: String },
    modelName: { type: String },
    manufacturingYear: { type: Number },
    fuelType: { type: String, enum: ['Petrol', 'Diesel', 'CNG', 'Electric'] },
    marketValue: { type: Number },
    insuredValue: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.InsuredAsset || mongoose.model('InsuredAsset', InsuredAssetSchema, 'insuredassets');
