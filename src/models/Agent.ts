import mongoose, { Document, Schema } from 'mongoose';

export interface IAgent extends Document {
  agentCode: string;
  agentName: string;
  branch: string;
  mobile: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const AgentSchema = new Schema<IAgent>(
  {
    agentCode: { type: String, required: true, unique: true, index: true },
    agentName: { type: String, required: true },
    branch: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export default mongoose.models.Agent || mongoose.model('Agent', AgentSchema, 'Agent');
