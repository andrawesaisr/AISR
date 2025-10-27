
import { Response, NextFunction } from 'express';
import Project from '../models/Project';
import Organization from '../models/Organization';
import { AuthRequest } from '../middleware/auth';

export const checkProjectAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { projectId } = req.params;
  const userId = req.userId;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() === userId) {
      return next();
    }

    if (project.members.map(m => m.toString()).includes(userId)) {
      return next();
    }

    if (project.organization) {
      const org = await Organization.findById(project.organization);
      if (org && org.members.some(m => m.user.toString() === userId)) {
        return next();
      }
    }

    return res.status(403).json({ message: 'Not authorized for this project' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Check if user is a member of the project (for viewing)
export const isProjectMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    // Admin can view all projects
    if (req.user.role === 'admin') {
      return next();
    }

    const project = await Project.findById(id);
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

    return res.status(403).json({ message: 'Not authorized to view this project' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Check if user can edit/delete project (project owner or org owner)
export const isProjectOwner = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the project owner
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

    return res.status(403).json({ message: 'Only project owner or organization owner can perform this action' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Middleware to validate user can create project (owner role only, or no org)
export const validateProjectOrganization = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { organization } = req.body;
  const userId = req.userId;

  try {
    // If no organization specified, only allow if user has owner role
    if (!organization) {
      if (req.user.role === 'owner' || req.user.role === 'admin') {
        return next();
      }
      return res.status(403).json({ message: 'Only owners can create projects' });
    }

    // Check if user is organization owner
    const org = await Organization.findById(organization);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const member = org.members.find(m => m.user.toString() === userId);
    if (!member) {
      return res.status(403).json({ message: 'You must be a member of the organization' });
    }

    // Only organization owners can create projects
    if (member.role !== 'owner') {
      return res.status(403).json({ message: 'Only organization owners can create projects' });
    }

    next();
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
