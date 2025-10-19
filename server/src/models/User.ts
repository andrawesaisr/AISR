import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  avatar?: string;
  jobTitle?: string;
  department?: string;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'member'],
    default: 'member'
  },
  avatar: {
    type: String,
  },
  jobTitle: {
    type: String,
  },
  department: {
    type: String,
  },
}, {
  timestamps: true,
});

const User = model<IUser>('User', userSchema);

export default User;
