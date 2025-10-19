import { Schema, model, Document } from 'mongoose';

export interface ISprint extends Document {
  name: string;
  goal?: string;
  project: Schema.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'completed';
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const sprintSchema = new Schema<ISprint>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  goal: {
    type: String,
    trim: true,
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed'],
    default: 'planning',
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

const Sprint = model<ISprint>('Sprint', sprintSchema);

export default Sprint;
