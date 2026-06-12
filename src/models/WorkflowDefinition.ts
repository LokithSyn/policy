import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkflowTransition {
  fromStatus: string;
  toStatus: string;
  allowedRoles: string[];
  requiresComment: boolean;
  autoTrigger: boolean;
  triggerCondition?: string;
}

export interface IWorkflowDefinition extends Document {
  workflowCode: string;
  workflowName: string;
  entityType: string;
  initialStatus: string;
  terminalStatuses: string[];
  transitions: IWorkflowTransition[];
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowTransitionSchema = new Schema<IWorkflowTransition>(
  {
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    allowedRoles: { type: [String], default: [] },
    requiresComment: { type: Boolean, default: false },
    autoTrigger: { type: Boolean, default: false },
    triggerCondition: { type: String },
  },
  { _id: false }
);

const WorkflowDefinitionSchema = new Schema<IWorkflowDefinition>(
  {
    workflowCode: { type: String, required: true, unique: true, index: true },
    workflowName: { type: String, required: true },
    entityType: { type: String, required: true, index: true },
    initialStatus: { type: String, required: true },
    terminalStatuses: { type: [String], default: [] },
    transitions: { type: [WorkflowTransitionSchema], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.models.WorkflowDefinition ||
  mongoose.model<IWorkflowDefinition>('WorkflowDefinition', WorkflowDefinitionSchema, 'workflowDefinitions');
