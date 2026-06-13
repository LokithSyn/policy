import mongoose, { Schema, Document } from 'mongoose';

export type FnolValidationStatus = 'PENDING' | 'VALIDATED' | 'FAILED';
export type FnolStepStatus = 'PASS' | 'FAIL' | 'SKIP';

export interface IValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface IValidationWarning {
  field: string;
  message: string;
}

export interface IValidationStepResult {
  step: number;
  name: string;
  status: FnolStepStatus;
  errors: IValidationError[];
  warnings: IValidationWarning[];
  durationMs: number;
}

export interface IFnolExtractedData {
  policyNumber: string;
  insuredName: string;
  dateOfLoss: Date;
  vehicleNumber?: string;
  lossDescription: string;
  claimType?: string;
  contactNumber?: string;
  claimAmount?: number;
  incidentLocation?: string;
}

export interface IFnolIntake extends Document {
  intakeId: string;
  documentId: string;
  source: string;
  /** Original payload exactly as received from IntelliDoc */
  rawPayload?: Record<string, unknown>;
  /** Payload after field-mapping and type coercion */
  normalizedPayload?: Record<string, unknown>;
  extractedData: IFnolExtractedData;
  validationStatus: FnolValidationStatus;
  validationSteps: IValidationStepResult[];
  claimId?: string;
  claimNumber?: string;
  policyId?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ValidationErrorSchema = new Schema<IValidationError>(
  { field: String, message: String, code: String },
  { _id: false }
);

const ValidationWarningSchema = new Schema<IValidationWarning>(
  { field: String, message: String },
  { _id: false }
);

const ValidationStepSchema = new Schema<IValidationStepResult>(
  {
    step: { type: Number, required: true },
    name: { type: String, required: true },
    status: { type: String, enum: ['PASS', 'FAIL', 'SKIP'], required: true },
    errors: { type: [ValidationErrorSchema], default: [] },
    warnings: { type: [ValidationWarningSchema], default: [] },
    durationMs: { type: Number, default: 0 },
  },
  { _id: false, suppressReservedKeysWarning: true }
);

const FnolExtractedDataSchema = new Schema<IFnolExtractedData>(
  {
    policyNumber: { type: String, required: true },
    insuredName: { type: String, required: true },
    dateOfLoss: { type: Date, required: true },
    vehicleNumber: String,
    lossDescription: { type: String, required: true },
    claimType: String,
    contactNumber: String,
    claimAmount: Number,
    incidentLocation: String,
  },
  { _id: false }
);

const FnolIntakeSchema = new Schema<IFnolIntake>(
  {
    intakeId: { type: String, required: true, unique: true, index: true },
    documentId: { type: String, required: true, unique: true, index: true },
    source: { type: String, required: true },
    rawPayload: { type: Schema.Types.Mixed },
    normalizedPayload: { type: Schema.Types.Mixed },
    extractedData: { type: FnolExtractedDataSchema, required: true },
    validationStatus: {
      type: String,
      enum: ['PENDING', 'VALIDATED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    validationSteps: { type: [ValidationStepSchema], default: [] },
    claimId: { type: String, index: true },
    claimNumber: { type: String, index: true },
    policyId: { type: String, index: true },
    processedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.FnolIntake ||
  mongoose.model<IFnolIntake>('FnolIntake', FnolIntakeSchema, 'FnolIntake');
