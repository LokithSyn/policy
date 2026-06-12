import mongoose, { Schema, Document } from 'mongoose';

export interface IClaimTimeline extends Document {
  timelineId: string;
  claimId: string;
  claim?: mongoose.Types.ObjectId;
  eventType: string;
  fromStatus?: string;
  toStatus?: string;
  description: string;
  performedBy: string;
  performedAt: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ClaimTimelineSchema = new Schema<IClaimTimeline>(
  {
    timelineId: { type: String, required: true, unique: true, index: true },
    claimId: { type: String, required: true, index: true },
    claim: { type: Schema.Types.ObjectId, ref: 'ClaimsHistory' },
    eventType: { type: String, required: true, index: true },
    fromStatus: { type: String },
    toStatus: { type: String },
    description: { type: String, required: true },
    performedBy: { type: String, required: true },
    performedAt: { type: Date, default: Date.now, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.models.ClaimTimeline ||
  mongoose.model<IClaimTimeline>('ClaimTimeline', ClaimTimelineSchema, 'claimTimeline');
