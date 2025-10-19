import { Router, Request, Response } from 'express';
import Project from '../models/Project';
import Organization from '../models/Organization';
import { auth } from '../middleware/auth';

const router = Router();

interface AuthRequest extends Request {
  userId?: string;
}

// Get all projects
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    // Find all organizations where user is a member
    const userOrganizations = await Organization.find({
      'members.user': req.userId,
    }).select('_id');
    
    const organizationIds = userOrganizations.map(org => org._id);

    // Find projects where:
    // 1. User is owner or member, OR
    // 2. Project belongs to an organization the user is in
    const projects = await Project.find({
      $or: [
        { owner: req.userId },
        { members: req.userId },
        { organization: { $in: organizationIds } }
      ]
    })
      .populate('owner')
      .populate('members')
      .populate('organization');
    
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get one project
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id).populate('owner').populate('members').populate('organization');
    if (project == null) {
      return res.status(404).json({ message: 'Cannot find project' });
    }
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Create one project
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  const project = new Project({
    name: req.body.name,
    description: req.body.description,
    owner: req.userId,
    members: req.body.members || [req.userId],
    organization: req.body.organization,
  });

  try {
    const newProject = await project.save();
    const populated = await Project.findById(newProject._id)
      .populate('owner')
      .populate('members')
      .populate('organization');
    res.status(201).json(populated);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Update one project
router.patch('/:id', auth, async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (project == null) {
      return res.status(404).json({ message: 'Cannot find project' });
    }

    if (req.body.name != null) {
      project.name = req.body.name;
    }
    if (req.body.description != null) {
      project.description = req.body.description;
    }
    if (req.body.owner != null) {
      project.owner = req.body.owner;
    }
    if (req.body.members != null) {
      project.members = req.body.members;
    }
    if (req.body.organization !== undefined) {
      project.organization = req.body.organization;
    }

    const updatedProject = await project.save();
    const populated = await Project.findById(updatedProject._id)
      .populate('owner')
      .populate('members')
      .populate('organization');
    res.json(populated);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Delete one project
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (project == null) {
      return res.status(404).json({ message: 'Cannot find project' });
    }
    await project.deleteOne();
    res.json({ message: 'Deleted project' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
