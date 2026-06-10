import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISavedJob extends Document {
  userId: Types.ObjectId;
  jobId: string;
  jobTitle: string;
  company: string;
  companyLogo?: string;
  location?: string;
  salary?: string;
  employmentType?: string;
  savedAt: Date;
}

const savedJobSchema = new Schema<ISavedJob>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: String, required: true },
    jobTitle: { type: String, required: true },
    company: { type: String, required: true },
    companyLogo: String,
    location: String,
    salary: String,
    employmentType: String,
    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

savedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export const SavedJob = mongoose.model<ISavedJob>('SavedJob', savedJobSchema);
