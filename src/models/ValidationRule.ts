import mongoose, { Schema, Document } from 'mongoose';

export type RuleOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'IN'
  | 'NOT_IN'
  | 'IS_NULL'
  | 'IS_NOT_NULL'
  | 'REGEX';

export interface IValidationRule extends Document {
  ruleCode: string;
  ruleName: string;
  description: string;
  field: string;
  operator: RuleOperator;
  value?: string;
  errorMessage: string;
  severity: 'ERROR' | 'WARNING';
  category: string;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

const ValidationRuleSchema = new Schema<IValidationRule>(
  {
    ruleCode: { type: String, required: true, unique: true, index: true },
    ruleName: { type: String, required: true },
    description: { type: String, required: true },
    field: { type: String, required: true },
    operator: {
      type: String,
      enum: ['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'IN', 'NOT_IN', 'IS_NULL', 'IS_NOT_NULL', 'REGEX'],
      required: true,
    },
    value: { type: String },
    errorMessage: { type: String, required: true },
    severity: { type: String, enum: ['ERROR', 'WARNING'], default: 'ERROR' },
    category: { type: String, required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    priority: { type: Number, default: 100 },
  },
  { timestamps: true }
);

export default mongoose.models.ValidationRule ||
  mongoose.model<IValidationRule>('ValidationRule', ValidationRuleSchema, 'validationRules');
