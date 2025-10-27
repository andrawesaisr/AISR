import { Response, NextFunction } from 'express';
import Task from '../models/Task';
import Project from '../models/Project';
import Organization from '../models/Organization';
import { AuthRequest } from '../middleware/auth';

// Check if user has access to view a task (through project membership)
export const isTaskMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    // Admin can view all tasks
    if (req.user.role === 'admin') {
      return next();
    }

    const task = await Task.findById(id).populate('project');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is project owner
    if (project.owner.toString() === userId) {
      return next();
    }

    // Check if user is a project member
    if (project.members.map(m => m.toString()).includes(userId)) {
      return next();
    }

    // Check if user is in the project's organization
    if (project.organization) {
      const org = await Organization.findById(project.organization);
      if (org && org.members.some(m => m.user.toString() === userId)) {
        return next();
      }
    }

    return res.status(403).json({ message: 'Not authorized to access this task' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Check if user can edit/delete a task (owner only)
export const canEditTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const task = await Task.findById(id).populate('project');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is project owner
    if (project.owner.toString() === userId) {
      return next();
    }

    // Check if user is organization owner
    if (project.organization) {
      const org = await Organization.findById(project.organization);
      if (org) {
        const member = org.members.find(m => m.user.toString() === userId);
        if (member && member.role === 'owner') {
          return next();
        }
      }
    }

    return res.status(403).json({ message: 'Only owners can edit/delete tasks' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Validate user can create task in a project (owner only)
export const canCreateTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { project: projectId } = req.body;
  const userId = req.userId;

  try {
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is project owner
    if (project.owner.toString() === userId) {
      return next();
    }

    // Check if user is organization owner
    if (project.organization) {
      const org = await Organization.findById(project.organization);
      if (org) {
        const member = org.members.find(m => m.user.toString() === userId);
        if (member && member.role === 'owner') {
          return next();
        }
      }
    }

    return res.status(403).json({ message: 'Only owners can create tasks' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Check if user can view tasks for a project
export const canViewProjectTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { projectId } = req.params;
  const userId = req.userId;

  try {
    // Admin can view all tasks
    if (req.user.role === 'admin') {
      return next();
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is project owner
    if (project.owner.toString() === userId) {
      return next();
    }

    // Check if user is a project member
    if (project.members.map(m => m.toString()).includes(userId)) {
      return next();
    }

    // Check if user is in the project's organization (any role can view)
    if (project.organization) {
      const org = await Organization.findById(project.organization);
      if (org && org.members.some(m => m.user.toString() === userId)) {
        return next();
      }
    }

    return res.status(403).json({ message: 'Not authorized to view tasks for this project' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
