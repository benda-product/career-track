import mongoose, { Document, Schema, Types } from 'mongoose';

export type SkillCheckAssignmentStatus = 'assigned' | 'started' | 'completed' | 'expired';

export interface ISkillCheckAssignment extends Document {
  userId: Types.ObjectId;
  email: string;
  category: string;
  bendaLanguage: string;
  level: string;
  targetPath: string;
  status: SkillCheckAssignmentStatus;
  recruiterId?: string;
  recruiterName?: string;
  atsAssignmentId?: string;
  jobId?: string;
  dueDate?: Date;
  assignedAt: Date;
  completedAt?: Date;
  result?: {
    bendaTestId?: string;
    percentage?: number;
    passed?: boolean;
    certificateId?: string;
  };
  notes?: string;
}

const skillCheckAssignmentSchema = new Schema<ISkillCheckAssignment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    category: { type: String, required: true },
    bendaLanguage: { type: String, required: true },
    level: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    targetPath: { type: String, required: true },
    status: {
      type: String,
      enum: ['assigned', 'started', 'completed', 'expired'],
      default: 'assigned',
    },
    recruiterId: String,
    recruiterName: String,
    atsAssignmentId: String,
    jobId: String,
    dueDate: Date,
    assignedAt: { type: Date, default: Date.now },
    completedAt: Date,
    result: {
      bendaTestId: String,
      percentage: Number,
      passed: Boolean,
      certificateId: String,
    },
    notes: String,
  },
  { timestamps: true }
);

skillCheckAssignmentSchema.index({ userId: 1, status: 1, assignedAt: -1 });
skillCheckAssignmentSchema.index({ atsAssignmentId: 1 }, { sparse: true });

export const SkillCheckAssignment = mongoose.model<ISkillCheckAssignment>(
  'SkillCheckAssignment',
  skillCheckAssignmentSchema
);
