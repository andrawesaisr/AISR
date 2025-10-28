import { Router, Request, Response } from 'express';
import DocumentModel from '../models/Document';
import Project from '../models/Project';
import Organization from '../models/Organization';
import { auth } from '../middleware/auth';
import { canViewDocument, canEditDocument, canDeleteDocument, validateDocumentProject } from '../middleware/checkDocumentAuth';

const router = Router();

// Get all documents for a user
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    let documents;

    if ((req as any).user.role === 'admin') {
      documents = await DocumentModel.find()
        .populate('owner', 'username email')
        .populate('collaborators', 'username email')
        .populate('project');
    } else {
      const userOrganizations = await Organization.find({
        'members.user': userId,
      }).select('_id');
      
      const organizationIds = userOrganizations.map(org => org._id);
      
      const organizationProjects = await Project.find({
        organization: { $in: organizationIds }
      }).select('_id');
      
      const projectIds = organizationProjects.map(proj => proj._id);
      
      documents = await DocumentModel.find({
        $or: [
          { owner: userId },
          { collaborators: userId },
          { isPublic: true },
          { project: { $in: projectIds } }
        ]
      })
        .populate('owner', 'username email')
        .populate('collaborators', 'username email')
        .populate('project');
    }
    
    res.json(documents);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single document
router.get('/:id', auth, canViewDocument, async (req: Request, res: Response) => {
  try {
    const document = await DocumentModel.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('collaborators', 'username email');
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    res.json(document);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new document
router.post('/', auth, validateDocumentProject, async (req: Request, res: Response) => {
  try {
    const document = new DocumentModel({
      ...req.body,
      owner: (req as any).userId,
    });
    
    const newDocument = await document.save();
    res.status(201).json(newDocument);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Update a document
router.patch('/:id', auth, canEditDocument, async (req: Request, res: Response) => {
  try {
    const document = await DocumentModel.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    Object.assign(document, req.body);
    const updatedDocument = await document.save();
    res.json(updatedDocument);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a document
router.delete('/:id', auth, canDeleteDocument, async (req: Request, res: Response) => {
  try {
    const document = await DocumentModel.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    await document.deleteOne();
    res.json({ message: 'Document deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
