import { Schema, model, Document as MongoDocument } from 'mongoose';
import { IUser } from './User';
import { IProject } from './Project';

export interface IDocument extends MongoDocument {
  title: string;
  content: string;
  project?: IProject['_id'];
  owner: IUser['_id'];
  collaborators: IUser['_id'][];
  tags: string[];
  isPublic: boolean;
  docType: 'note' | 'meeting' | 'decision' | 'retro' | 'spec' | 'research' | 'custom';
  summary?: string;
}

const documentSchema = new Schema<IDocument>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    default: '',
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
  tags: [{
    type: String,
    trim: true,
  }],
  isPublic: {
    type: Boolean,
    default: false,
  },
  docType: {
    type: String,
    enum: ['note', 'meeting', 'decision', 'retro', 'spec', 'research', 'custom'],
    default: 'note',
  },
  summary: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

const DocumentModel = model<IDocument>('Document', documentSchema);

export default DocumentModel;
