import mongoose, { Schema, Document } from 'mongoose';

export interface IFraudRule extends Document {
  ruleCode: string;
  ruleName: string;
  description: string;
  ruleType: 'THRESHOLD' | 'DUPLICATE' | 'PATTERN' | 'VELOCITY';
  field?: string;
  operator?: string;
  thresholdValue?: number;
  windowDays?: number;
  flagMessage: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

const FraudRuleSchema = new Schema<IFraudRule>(
  {
    ruleCode: { type: String, required: true, unique: true, index: true },
    ruleName: { type: String, required: true },
    description: { type: String, required: true },
    ruleType: {
      type: String,
      enum: ['THRESHOLD', 'DUPLICATE', 'PATTERN', 'VELOCITY'],
      required: true,
    },
    field: { type: String },
    operator: { type: String },
    thresholdValue: { type: Number },
    windowDays: { type: Number },
    flagMessage: { type: String, required: true },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    isActive: { type: Boolean, default: true, index: true },
    priority: { type: Number, default: 100 },
  },
  { timestamps: true }
);

export default mongoose.models.FraudRule ||
  mongoose.model<IFraudRule>('FraudRule', FraudRuleSchema, 'fraudRules');
