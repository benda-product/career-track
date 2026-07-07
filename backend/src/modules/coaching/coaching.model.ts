import mongoose, { Document, Schema } from 'mongoose';

export interface ICoachingRequest extends Document {
  userId: mongoose.Types.ObjectId;
  topic: string;
  message: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const coachingRequestSchema = new Schema<ICoachingRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export const CoachingRequest = mongoose.model<ICoachingRequest>(
  'CoachingRequest',
  coachingRequestSchema
);
