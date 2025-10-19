import { Router, Request, Response } from 'express';
import Sprint from '../models/Sprint';
import Task from '../models/Task';
import { auth } from '../middleware/auth';

const router = Router();

interface AuthRequest extends Request {
  userId?: string;
}

// Get all sprints for a project
router.get('/project/:projectId', auth, async (req: Request, res: Response) => {
  try {
    const sprints = await Sprint.find({ project: req.params.projectId })
      .populate('createdBy', 'username email')
      .sort({ startDate: -1 });
    res.json(sprints);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get sprint by ID with tasks
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const sprint = await Sprint.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('project');
    
    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    // Get tasks in this sprint
    const tasks = await Task.find({ sprint: sprint._id })
      .populate('assignee', 'username email avatar')
      .populate('reporter', 'username email');

    res.json({ sprint, tasks });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Create sprint
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const sprint = new Sprint({
      ...req.body,
      createdBy: req.userId,
    });
    const newSprint = await sprint.save();
    res.status(201).json(newSprint);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Update sprint
router.patch('/:id', auth, async (req: Request, res: Response) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    Object.assign(sprint, req.body);
    const updatedSprint = await sprint.save();
    res.json(updatedSprint);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Start sprint
router.post('/:id/start', auth, async (req: Request, res: Response) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    sprint.status = 'active';
    if (!sprint.startDate || sprint.startDate > new Date()) {
      sprint.startDate = new Date();
    }
    
    const updatedSprint = await sprint.save();
    res.json(updatedSprint);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Complete sprint
router.post('/:id/complete', auth, async (req: Request, res: Response) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    sprint.status = 'completed';
    sprint.endDate = new Date();
    
    const updatedSprint = await sprint.save();
    res.json(updatedSprint);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Get sprint statistics (for burndown chart)
router.get('/:id/stats', auth, async (req: Request, res: Response) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    const tasks = await Task.find({ sprint: sprint._id });
    
    const totalStoryPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    const completedStoryPoints = tasks
      .filter(t => t.status === 'Done')
      .reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const todoTasks = tasks.filter(t => t.status === 'To Do').length;

    // Calculate days
    const totalDays = Math.ceil((sprint.endDate.getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((new Date().getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);

    res.json({
      totalStoryPoints,
      completedStoryPoints,
      remainingStoryPoints: totalStoryPoints - completedStoryPoints,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      totalDays,
      daysElapsed,
      daysRemaining,
      velocity: daysElapsed > 0 ? completedStoryPoints / daysElapsed : 0,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Delete sprint
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    // Remove sprint reference from tasks
    await Task.updateMany({ sprint: sprint._id }, { $unset: { sprint: 1 } });
    
    await sprint.deleteOne();
    res.json({ message: 'Sprint deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
