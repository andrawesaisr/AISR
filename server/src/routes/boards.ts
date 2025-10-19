import { Router, Request, Response } from 'express';
import Board from '../models/Board';
import Project from '../models/Project';
import Organization from '../models/Organization';
import { auth } from '../middleware/auth';

const router = Router();

// Get all boards for a user
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    // Find all organizations where user is a member
    const userOrganizations = await Organization.find({
      'members.user': userId,
    }).select('_id');
    
    const organizationIds = userOrganizations.map(org => org._id);
    
    // Find all projects in user's organizations
    const organizationProjects = await Project.find({
      organization: { $in: organizationIds }
    }).select('_id');
    
    const projectIds = organizationProjects.map(proj => proj._id);
    
    // Find boards where:
    // 1. User is owner or collaborator, OR
    // 2. Board belongs to a project in user's organizations
    const boards = await Board.find({
      $or: [
        { owner: userId },
        { collaborators: userId },
        { project: { $in: projectIds } }
      ]
    })
      .populate('owner', 'username email')
      .populate('collaborators', 'username email')
      .populate('project');
    
    res.json(boards);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single board
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('collaborators', 'username email');
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    res.json(board);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new board
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const board = new Board({
      ...req.body,
      owner: (req as any).userId,
      elements: [],
    });
    
    const newBoard = await board.save();
    res.status(201).json(newBoard);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Update a board
router.patch('/:id', auth, async (req: Request, res: Response) => {
  try {
    const board = await Board.findById(req.params.id);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    Object.assign(board, req.body);
    const updatedBoard = await board.save();
    res.json(updatedBoard);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a board
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const board = await Board.findById(req.params.id);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    await board.deleteOne();
    res.json({ message: 'Board deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
