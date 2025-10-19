import { Schema, model, Document } from 'mongoose';
import { IUser } from './User';
import { IOrganization } from './Organization';

export interface IProject extends Document {
  name: string;
  description?: string;
  owner: IUser['_id'];
  members: IUser['_id'][];
  organization?: IOrganization['_id'];
}

const projectSchema = new Schema<IProject>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
  },
}, {
  timestamps: true,
});

const Project = model<IProject>('Project', projectSchema);

export default Project;
