import { Router, Response } from 'express';
import prisma, { Prisma } from '../prismaClient';
import { DocumentType } from '../generated/prisma/client';
import { auth, AuthRequest } from '../middleware/auth';
import {
  canViewDocument,
  canEditDocument,
  canDeleteDocument,
  validateDocumentProject,
} from '../middleware/checkDocumentAuth';

const router = Router();

const mapDocType = (docType?: string): DocumentType => {
  const typeMap: Record<string, DocumentType> = {
    'note': DocumentType.NOTE,
    'meeting': DocumentType.MEETING,
    'decision': DocumentType.DECISION,
    'retro': DocumentType.RETRO,
    'spec': DocumentType.SPEC,
    'research': DocumentType.RESEARCH,
    'custom': DocumentType.CUSTOM,
  };
  return typeMap[docType?.toLowerCase() || 'note'] || DocumentType.NOTE;
};

const USER_PUBLIC_SELECT = {
  id: true,
  username: true,
  email: true,
  role: true,
  avatar: true,
  jobTitle: true,
  department: true,
  createdAt: true,
  updatedAt: true,
};

const DOCUMENT_INCLUDE = {
  owner: { select: USER_PUBLIC_SELECT },
  collaborators: { select: USER_PUBLIC_SELECT },
  project: {
    include: {
      owner: { select: USER_PUBLIC_SELECT },
      organization: {
        include: {
          members: true,
        },
      },
    },
  },
};

// Get all documents for a user
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const where =
      req.user?.role === 'admin'
        ? undefined
        : {
            OR: [
              { ownerId: req.userId },
              {
                collaborators: {
                  some: { id: req.userId },
                },
              },
              { isPublic: true },
              {
                project: {
                  organization: {
                    members: {
                      some: {
                        userId: req.userId,
                      },
                    },
                  },
                },
              },
            ],
          };

    const documents = await prisma.document.findMany({
      where,
      include: DOCUMENT_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });

    res.json(documents);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to fetch documents' });
  }
});

// Get a single document
router.get('/:id', auth, canViewDocument, async (req: AuthRequest, res: Response) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: DOCUMENT_INCLUDE,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(document);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to fetch document' });
  }
});

// Create a new document
router.post('/', auth, validateDocumentProject, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const collaboratorIds: string[] = Array.isArray(req.body.collaborators)
      ? req.body.collaborators
      : [];
    const uniqueCollaborators = Array.from(new Set(collaboratorIds));

    const document = await prisma.document.create({
      data: {
        title: req.body.title,
        content: req.body.content ?? '',
        ownerId: req.userId,
        projectId:
          typeof req.body.project === 'string' && req.body.project.trim().length > 0
            ? req.body.project
            : null,
        collaborators: {
          connect: uniqueCollaborators.map((id) => ({ id })),
        },
        tags: Array.isArray(req.body.tags) ? req.body.tags : [],
        isPublic: Boolean(req.body.isPublic),
        docType: mapDocType(req.body.docType),
        summary: req.body.summary ?? '',
      },
      include: DOCUMENT_INCLUDE,
    });

    res.status(201).json(document);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid project or collaborator reference' });
    }
    res.status(500).json({ message: err.message || 'Unable to create document' });
  }
});

// Update a document
router.patch('/:id', auth, canEditDocument, async (req: AuthRequest, res: Response) => {
  try {
    const data: Prisma.DocumentUpdateInput = {};

    if (req.body.title !== undefined) data.title = req.body.title;
    if (req.body.content !== undefined) data.content = req.body.content;
    if (req.body.isPublic !== undefined) data.isPublic = Boolean(req.body.isPublic);
    if (req.body.docType !== undefined) data.docType = mapDocType(req.body.docType);
    if (req.body.summary !== undefined) data.summary = req.body.summary ?? '';
    if (req.body.tags !== undefined) {
      data.tags = Array.isArray(req.body.tags) ? req.body.tags : [];
    }

    if (req.body.collaborators !== undefined) {
      const collaboratorIds: string[] = Array.isArray(req.body.collaborators)
        ? req.body.collaborators
        : [];
      const uniqueCollaborators = Array.from(new Set(collaboratorIds));
      data.collaborators = {
        set: uniqueCollaborators.map((id) => ({ id })),
      };
    }

    if (req.body.project !== undefined) {
      const projectId =
        typeof req.body.project === 'string' && req.body.project.trim().length > 0
          ? req.body.project
          : null;
      data.project = projectId ? { connect: { id: projectId } } : { disconnect: true };
    }

    if (req.body.owner !== undefined) {
      const ownerId =
        typeof req.body.owner === 'string' && req.body.owner.trim().length > 0
          ? req.body.owner
          : null;
      if (ownerId) {
        data.owner = { connect: { id: ownerId } };
      }
    }

    const document = await prisma.document.update({
      where: { id: req.params.id },
      data,
      include: DOCUMENT_INCLUDE,
    });

    res.json(document);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return res.status(404).json({ message: 'Document not found' });
      }
      if (err.code === 'P2003') {
        return res.status(400).json({ message: 'Invalid reference in update payload' });
      }
    }
    res.status(500).json({ message: err.message || 'Unable to update document' });
  }
});

// Delete a document
router.delete('/:id', auth, canDeleteDocument, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.document.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Document deleted' });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.status(500).json({ message: err.message || 'Unable to delete document' });
  }
});

export default router;
