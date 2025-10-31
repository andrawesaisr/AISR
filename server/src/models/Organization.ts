import { Schema, model, Document } from 'mongoose';
import { IUser } from './User';

export interface IOrganizationMember {
  user: IUser['_id'];
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}

export interface IInvitation {
  _id?: any;
  email: string;
  role: 'admin' | 'member';
  invitedBy: IUser['_id'];
  token: string;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: Date;
}

export interface IOrganization extends Document {
  name: string;
  description?: string;
  members: IOrganizationMember[];
  invitations: IInvitation[];
  createdBy: IUser['_id'];
  settings?: {
    allowMemberInvite: boolean;
    requireApproval: boolean;
  };
}

const organizationMemberSchema = new Schema<IOrganizationMember>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member'],
    default: 'member',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const invitationSchema = new Schema<IInvitation>({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member',
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const organizationSchema = new Schema<IOrganization>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  members: [organizationMemberSchema],
  invitations: {
    type: [invitationSchema],
    default: [],
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  settings: {
    allowMemberInvite: {
      type: Boolean,
      default: false,
    },
    requireApproval: {
      type: Boolean,
      default: false,
    },
  },
}, {
  timestamps: true,
});

// Index for faster queries
organizationSchema.index({ 'members.user': 1 });
organizationSchema.index({ 'invitations.email': 1 });
organizationSchema.index({ 'invitations.token': 1 }, { unique: true, sparse: true });

const Organization = model<IOrganization>('Organization', organizationSchema);

export default Organization;
