import { Response, NextFunction } from 'express';
import prisma, { Prisma } from '../prismaClient';
import { AuthRequest } from '../middleware/auth';
import {
  isOrganizationOwner,
  isUserInOrganization,
  projectAccessSelection,
} from './checkProjectAuth';

type DocumentCollaborator = { id: string };
type ProjectMember = { id: string };
type OrganizationMember = { userId: string; role: 'OWNER' | 'ADMIN' | 'MEMBER' };

const documentAccessSelection = {
  id: true,
  ownerId: true,
  isPublic: true,
  collaborators: {
    select: {
      id: true,
    },
  },
  project: {
    select: projectAccessSelection,
  },
};

const fetchDocumentWithProject = async (id: string) =>
  prisma.document.findUnique({
    where: { id },
    select: documentAccessSelection,
  });

const fetchProjectById = async (projectId: string) =>
  prisma.project.findUnique({
    where: { id: projectId },
    select: projectAccessSelection,
  });

// Check if user can view a document
export const canViewDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    if (req.user?.role === 'ADMIN') {
      return next();
    }

    const document = await fetchDocumentWithProject(id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.isPublic) {
      return next();
    }

    if (document.ownerId === userId) {
      return next();
    }

    if (
      document.collaborators.some(
        (collaborator: DocumentCollaborator) => collaborator.id === userId
      )
    ) {
      return next();
    }

    const project = document.project;

    if (project?.deletedAt) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project) {
      if (project.ownerId === userId) {
        return next();
      }

      if (project.members.some((member: ProjectMember) => member.id === userId)) {
        return next();
      }

      if (isUserInOrganization(project.organization, userId)) {
        return next();
      }
    }

    return res.status(403).json({ message: 'Not authorized to view this document' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to authorize document access' });
  }
};

// Check if user can edit a document (owner only)
export const canEditDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    const document = await fetchDocumentWithProject(id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.ownerId === userId) {
      return next();
    }

    const project = document.project;

    if (project?.deletedAt) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project && isOrganizationOwner(project.organization, userId)) {
      return next();
    }

    return res.status(403).json({ message: 'Only document owner can edit this document' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to authorize document update' });
  }
};

// Check if user can delete a document (owner only)
export const canDeleteDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    const document = await fetchDocumentWithProject(id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.ownerId === userId) {
      return next();
    }

    const project = document.project;

    if (project?.deletedAt) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project && isOrganizationOwner(project.organization, userId)) {
      return next();
    }

    return res.status(403).json({ message: 'Only document owner can delete this document' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to authorize document deletion' });
  }
};

// Validate user can create document (owner only)
export const validateDocumentProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { project: projectId } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    if (!projectId) {
      console.log("req.user: ", req.user)
      if (req.user?.role === 'OWNER' || req.user?.role === 'ADMIN') {
        return next();
      }
      return res.status(403).json({ message: 'Only owners or admins can create documents' });
    }

    const project = await fetchProjectById(projectId);
    if (!project || project.deletedAt) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.ownerId === userId) {
      return next();
    }

    if (isOrganizationOwner(project.organization, userId)) {
      return next();
    }

    return res.status(403).json({ message: 'Only owners can create documents' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to validate document permissions' });
  }
};
