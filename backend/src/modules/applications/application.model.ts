import mongoose, { Document, Schema, Types } from 'mongoose';
import { ApplicationStage } from '../../types';

export interface IApplicationTimeline {
  stage: ApplicationStage;
  date: Date;
  note?: string;
  updatedBy?: string;
}

export interface IApplication extends Document {
  userId: Types.ObjectId;
  jobId: string;
  jobTitle: string;
  company: string;
  companyLogo?: string;
  location?: string;
  salary?: string;
  stage: ApplicationStage;
  appliedAt: Date;
  timeline: IApplicationTimeline[];
  recruiterFeedback?: string;
  notes?: string;
  atsApplicationId?: string;
  /** Fine-grained Talent Desk pipeline stage (source of truth when linked). */
  atsStage?: string;
  resumeId?: string;
  resumeTitle?: string;
  isSaved: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: String, required: true },
    jobTitle: { type: String, required: true },
    company: { type: String, required: true },
    companyLogo: String,
    location: String,
    salary: String,
    stage: {
      type: String,
      enum: ['applied', 'screening', 'shortlisted', 'interview', 'offer', 'rejected', 'hired'],
      default: 'applied',
    },
    appliedAt: { type: Date, default: Date.now },
    timeline: [
      {
        stage: {
          type: String,
          enum: ['applied', 'screening', 'shortlisted', 'interview', 'offer', 'rejected', 'hired'],
        },
        date: { type: Date, default: Date.now },
        note: String,
        updatedBy: String,
      },
    ],
    recruiterFeedback: String,
    notes: String,
    atsApplicationId: String,
    atsStage: String,
    resumeId: String,
    resumeTitle: String,
    isSaved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });
applicationSchema.index({ userId: 1, stage: 1 });
applicationSchema.index({ userId: 1, appliedAt: -1 });
applicationSchema.index({ atsApplicationId: 1 }, { sparse: true });

export const Application = mongoose.model<IApplication>('Application', applicationSchema);
