// API response types based on Prisma schema

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'owner' | 'member';
  avatar?: string;
  jobTitle?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  allowMemberInvite: boolean;
  requireApproval: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  organization?: Organization;
  members?: User[];
}

export interface Task {
  id: string;
  _id?: string; // MongoDB compatibility
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  status: 'To Do' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate?: string;
  tags: string[];
  attachments: string[];
  estimatedHours?: number;
  actualHours?: number;
  storyPoints?: number;
  sprintId?: string;
  type: 'Story' | 'Bug' | 'Task' | 'Epic';
  epicLinkId?: string;
  reporterId?: string;
  createdAt: string;
  updatedAt: string;
  project?: Project | string;
  assignee?: User;
  reporter?: User;
}

export interface Document {
  id: string;
  _id?: string; // MongoDB compatibility
  title: string;
  content: string;
  projectId?: string;
  ownerId: string;
  tags: string[];
  isPublic: boolean;
  docType: 'note' | 'meeting' | 'decision' | 'retro' | 'spec' | 'research' | 'custom';
  summary: string;
  createdAt: string;
  updatedAt: string;
  project?: Project | string;
  owner?: User;
  collaborators?: User[];
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  parentCommentId?: string;
  createdAt: string;
  updatedAt: string;
  author?: User;
  replies?: Comment[];
}
