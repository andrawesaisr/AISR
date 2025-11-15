import { Response, NextFunction } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from '../middleware/auth';
import {
  isOrganizationOwner,
  isOrganizationOwnerOrAdmin,
  isUserInOrganization,
  projectAccessSelection,
} from './checkProjectAuth';

type ProjectMember = { id: string };

const fetchProjectForTask = async (taskId: string) =>
  prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      projectId: true,
      project: {
        select: projectAccessSelection,
      },
    },
  });

const fetchProjectById = async (projectId: string) =>
  prisma.project.findUnique({
    where: { id: projectId },
    select: projectAccessSelection,
  });

// Check if user has access to view a task (through project membership)
export const isTaskMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    if (req.user?.role === 'admin') {
      return next();
    }

    const task = await fetchProjectForTask(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = task.project;

    if (!project || project.deletedAt) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.ownerId === userId) {
      return next();
    }

    if (project.members.some((member: ProjectMember) => member.id === userId)) {
      return next();
    }

    if (isUserInOrganization(project.organization, userId)) {
      return next();
    }

    return res.status(403).json({ message: 'Not authorized to access this task' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to authorize task access' });
  }
};

// Check if user can edit/delete a task (owner only)
export const canEditTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    const task = await fetchProjectForTask(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = task.project;

    if (!project || project.deletedAt) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.ownerId === userId) {
      return next();
    }

    if (isOrganizationOwnerOrAdmin(project.organization, userId)) {
      return next();
    }

    return res.status(403).json({ message: 'Only owners can edit/delete tasks' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to authorize task update' });
  }
};

// Validate user can create task in a project (owner only)
export const canCreateTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { project: projectId } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await fetchProjectById(projectId);
    if (!project || project.deletedAt) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.ownerId === userId) {
      return next();
    }

    if (isOrganizationOwnerOrAdmin(project.organization, userId)) {
      return next();
    }

    return res.status(403).json({ message: 'Only owners or admins can create tasks' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to authorize task creation' });
  }
};

// Check if user can view tasks for a project
export const canViewProjectTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { projectId } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    if (req.user?.role === 'admin') {
      return next();
    }

    const project = await fetchProjectById(projectId);
    if (!project || project.deletedAt) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.ownerId === userId) {
      return next();
    }

    if (project.members.some((member: ProjectMember) => member.id === userId)) {
      return next();
    }

    if (isUserInOrganization(project.organization, userId)) {
      return next();
    }

    return res.status(403).json({ message: 'Not authorized to view tasks for this project' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to authorize project tasks view' });
  }
};
