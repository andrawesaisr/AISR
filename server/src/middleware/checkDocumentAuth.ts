import { Response, NextFunction } from 'express';
import DocumentModel from '../models/Document';
import Project from '../models/Project';
import Organization from '../models/Organization';
import { AuthRequest } from '../middleware/auth';

// Check if user can view a document
export const canViewDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    // Admin can view all documents
    if (req.user.role === 'admin') {
      return next();
    }

    const document = await DocumentModel.findById(id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Public documents can be viewed by anyone
    if (document.isPublic) {
      return next();
    }

    // Check if user is the owner
    if (document.owner.toString() === userId) {
      return next();
    }

    // Check if user is a collaborator
    if (document.collaborators && document.collaborators.map(c => c.toString()).includes(userId)) {
      return next();
    }

    // Check if document belongs to a project the user has access to
    if (document.project) {
      const project = await Project.findById(document.project);
      if (project) {
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
      }
    }

    return res.status(403).json({ message: 'Not authorized to view this document' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Check if user can edit a document (owner only)
export const canEditDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const document = await DocumentModel.findById(id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user is the owner
    if (document.owner.toString() === userId) {
      return next();
    }

    // Check if user is organization owner (if document is in a project with org)
    if (document.project) {
      const project = await Project.findById(document.project);
      if (project && project.organization) {
        const org = await Organization.findById(project.organization);
        if (org) {
          const member = org.members.find(m => m.user.toString() === userId);
          if (member && member.role === 'owner') {
            return next();
          }
        }
      }
    }

    return res.status(403).json({ message: 'Only document owner can edit this document' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Check if user can delete a document (owner only)
export const canDeleteDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const document = await DocumentModel.findById(id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user is the document owner
    if (document.owner.toString() === userId) {
      return next();
    }

    // Check if user is organization owner (if document is in a project with org)
    if (document.project) {
      const project = await Project.findById(document.project);
      if (project && project.organization) {
        const org = await Organization.findById(project.organization);
        if (org) {
          const member = org.members.find(m => m.user.toString() === userId);
          if (member && member.role === 'owner') {
            return next();
          }
        }
      }
    }

    return res.status(403).json({ message: 'Only document owner can delete this document' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Validate user can create document (owner only)
export const validateDocumentProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { project: projectId } = req.body;
  const userId = req.userId;

  try {
    // If no project specified, only owner role can create personal documents
    if (!projectId) {
      if (req.user.role === 'owner' || req.user.role === 'admin') {
        return next();
      }
      return res.status(403).json({ message: 'Only owners or admins can create documents' });
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

    return res.status(403).json({ message: 'Only owners can create documents' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
