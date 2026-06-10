import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRecentlyViewed extends Document {
  userId: Types.ObjectId;
  jobId: string;
  jobTitle: string;
  company: string;
  viewedAt: Date;
}

const recentlyViewedSchema = new Schema<IRecentlyViewed>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: String, required: true },
    jobTitle: { type: String, required: true },
    company: { type: String, required: true },
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

recentlyViewedSchema.index({ userId: 1, jobId: 1 }, { unique: true });
recentlyViewedSchema.index({ userId: 1, viewedAt: -1 });

export const RecentlyViewed = mongoose.model<IRecentlyViewed>('RecentlyViewed', recentlyViewedSchema);
