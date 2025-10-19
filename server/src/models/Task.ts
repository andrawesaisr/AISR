import { Schema, model, Document } from 'mongoose';
import { IProject } from './Project';
import { IUser } from './User';

export interface ITask extends Document {
  title: string;
  description?: string;
  project: IProject['_id'];
  assignee?: IUser['_id'];
  status: 'To Do' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate?: Date;
  tags: string[];
  attachments: string[];
  estimatedHours?: number;
  actualHours?: number;
  storyPoints?: number;
  sprint?: Schema.Types.ObjectId;
  type: 'Story' | 'Bug' | 'Task' | 'Epic';
  epicLink?: Schema.Types.ObjectId;
  reporter?: IUser['_id'];
}

const taskSchema = new Schema<ITask>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  assignee: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['To Do', 'In Progress', 'Done'],
    default: 'To Do',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium',
  },
  dueDate: {
    type: Date,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  attachments: [{
    type: String,
  }],
  estimatedHours: {
    type: Number,
    min: 0,
  },
  actualHours: {
    type: Number,
    min: 0,
  },
  storyPoints: {
    type: Number,
    min: 0,
  },
  sprint: {
    type: Schema.Types.ObjectId,
    ref: 'Sprint',
  },
  type: {
    type: String,
    enum: ['Story', 'Bug', 'Task', 'Epic'],
    default: 'Task',
  },
  epicLink: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
  },
  reporter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

const Task = model<ITask>('Task', taskSchema);

export default Task;
