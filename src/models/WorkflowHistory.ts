import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkflowHistory extends Document {
  historyId: string;
  entityType: string;
  entityId: string;
  workflowCode: string;
  fromStatus: string;
  toStatus: string;
  transitionedBy: string;
  transitionedAt: Date;
  comment?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowHistorySchema = new Schema<IWorkflowHistory>(
  {
    historyId: { type: String, required: true, unique: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    workflowCode: { type: String, required: true, index: true },
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    transitionedBy: { type: String, required: true },
    transitionedAt: { type: Date, default: Date.now, index: true },
    comment: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.models.WorkflowHistory ||
  mongoose.model<IWorkflowHistory>('WorkflowHistory', WorkflowHistorySchema, 'workflowHistory');
