import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entity: {
      type: String,
      enum: [
        'Policy', 'Claim', 'Customer', 'Coverage', 'ClaimsHistory',
        'InsuredAsset', 'Endorsement', 'PolicyDocument', 'Agent',
        'ClaimDocument', 'ClaimTimeline', 'WorkflowHistory',
        'ValidationRule', 'FraudRule', 'ClaimDocumentRule',
        'WorkflowDefinition', 'FnolValidation',
      ],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    oldValue: {
      type: Schema.Types.Mixed,
    },
    newValue: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
