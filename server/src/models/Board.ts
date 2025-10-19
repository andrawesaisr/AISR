import { Schema, model, Document } from 'mongoose';
import { IUser } from './User';
import { IProject } from './Project';

export interface IElement {
  id: string;
  type: 'text' | 'shape' | 'sticky' | 'image' | 'connector';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  color?: string;
  fontSize?: number;
  shapeType?: 'rectangle' | 'circle' | 'triangle';
  rotation?: number;
}

export interface IBoard extends Document {
  name: string;
  description?: string;
  project?: IProject['_id'];
  owner: IUser['_id'];
  collaborators: IUser['_id'][];
  elements: IElement[];
  backgroundColor: string;
}

const elementSchema = new Schema<IElement>({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'shape', 'sticky', 'image', 'connector'],
    required: true,
  },
  x: {
    type: Number,
    required: true,
  },
  y: {
    type: Number,
    required: true,
  },
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  content: String,
  color: String,
  fontSize: Number,
  shapeType: {
    type: String,
    enum: ['rectangle', 'circle', 'triangle'],
  },
  rotation: Number,
}, { _id: false });

const boardSchema = new Schema<IBoard>({
  name: {
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
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  collaborators: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  elements: [elementSchema],
  backgroundColor: {
    type: String,
    default: '#ffffff',
  },
}, {
  timestamps: true,
});

const Board = model<IBoard>('Board', boardSchema);

export default Board;
