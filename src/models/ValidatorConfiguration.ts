import mongoose, { Document, Schema } from 'mongoose';

export interface IValidatorConfiguration extends Document {
  configId: string;
  claimType: string;
  coverageType: string;
  selectedFields: string[];
  validationRules: Array<{
    fieldName: string;
    validationType: string;
    validationSource: string;
    operator: string;
    priority: number;
    required: boolean;
    enabled: boolean;
  }>;
  claimNumberConfig: {
    prefix: string;
    year: number;
    sequenceStart: number;
    sequencePadding: number;
  };
  externalSystemId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ValidatorConfigurationSchema = new Schema<IValidatorConfiguration>(
  {
    configId: { type: String, required: true, unique: true, index: true },
    claimType: { type: String, required: true, index: true },
    coverageType: { type: String, required: true },
    selectedFields: { type: [String], required: true },
    validationRules: [
      {
        fieldName: String,
        validationType: String,
        validationSource: String,
        operator: String,
        priority: Number,
        required: Boolean,
        enabled: Boolean,
      },
    ],
    claimNumberConfig: {
      prefix: { type: String, required: true, default: 'CLM' },
      year: { type: Number, required: true },
      sequenceStart: { type: Number, default: 1 },
      sequencePadding: { type: Number, default: 6 },
    },
    externalSystemId: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.ValidatorConfiguration ||
  mongoose.model('ValidatorConfiguration', ValidatorConfigurationSchema, 'ValidatorConfiguration');
