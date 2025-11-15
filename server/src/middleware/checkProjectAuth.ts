import { Response, NextFunction } from 'express';
import prisma, { Prisma } from '../prismaClient';
import { AuthRequest } from '../middleware/auth';

type ProjectMember = { id: string };
type OrganizationMember = { userId: string; role: 'OWNER' | 'ADMIN' | 'MEMBER' };

export const projectAccessSelection = {
  id: true,
  ownerId: true,
  deletedAt: true,
  members: {
    select: {
      id: true,
    },
  },
  organization: {
    select: {
      id: true,
      members: {
        select: {
          userId: true,
          role: true,
        },
      },
    },
  },
};

export const isUserInOrganization = (
  organization: { members: OrganizationMember[] } | null,
  userId?: string
) =>
  Boolean(
    userId &&
      organization?.members.some((member: OrganizationMember) => member.userId === userId)
  );

export const isOrganizationOwner = (
  organization: { members: OrganizationMember[] } | null,
  userId?: string
) =>
  Boolean(
    userId &&
      organization?.members.some(
        (member: OrganizationMember) =>
          member.userId === userId && member.role === 'OWNER'
      )
  );

export const isOrganizationOwnerOrAdmin = (
  organization: { members: OrganizationMember[] } | null,
  userId?: string
) =>
  Boolean(
    userId &&
      organization?.members.some(
        (member: OrganizationMember) =>
          member.userId === userId && (member.role === 'OWNER' || member.role === 'ADMIN')
      )
  );
export const checkProjectAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { projectId } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: projectAccessSelection,
    });

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

    return res.status(403).json({ message: 'Not authorized for this project' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to authorize project access' });
  }
};

// Check if user is a member of the project (for viewing)
export const isProjectMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    if (req.user?.role === 'admin') {
      return next();
    }

    const project = await prisma.project.findUnique({
      where: { id },
      select: projectAccessSelection,
    });

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

    return res.status(403).json({ message: 'Not authorized to view this project' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to authorize project access' });
  }
};

// Check if user can edit/delete project (project owner or org owner)
export const isProjectOwner = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      select: projectAccessSelection,
    });

    if (!project || project.deletedAt) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.ownerId === userId) {
      return next();
    }

    if (isOrganizationOwner(project.organization, userId)) {
      return next();
    }

    return res.status(403).json({
      message: 'Only project owner or organization owner can perform this action',
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to authorize project ownership' });
  }
};

// Middleware to validate user can create project (owner role only, or no org)
export const validateProjectOrganization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { organization } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    if (!organization || organization === '') {
      if (req.user?.role === 'owner' || req.user?.role === 'admin') {
        return next();
      }
      return res.status(403).json({ message: 'Only owners can create projects' });
    }

    const org = await prisma.organization.findUnique({
      where: { id: organization },
      select: {
        id: true,
        members: {
          select: {
            userId: true,
            role: true,
          },
        },
      },
    });

    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const membership = org.members.find(
      (member: OrganizationMember) => member.userId === userId
    );

    if (!membership) {
      return res.status(403).json({ message: 'You must be a member of the organization' });
    }

    if (membership.role !== 'OWNER') {
      return res.status(403).json({ message: 'Only organization owners can create projects' });
    }

    next();
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to validate organization permissions' });
  }
};
