import { Router, Request, Response } from 'express';
import Task from '../models/Task';
import { auth } from '../middleware/auth';
import { isTaskMember, canEditTask, canCreateTask, canViewProjectTasks } from '../middleware/checkTaskAuth';

const router = Router();

interface AuthRequest extends Request {
  userId?: string;
}

// Get all tasks for a project
router.get('/project/:projectId', auth, canViewProjectTasks, async (req: Request, res: Response) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId }).populate('assignee');
    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get one task
router.get('/:id', auth, isTaskMember, async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignee');
    if (task == null) {
      return res.status(404).json({ message: 'Cannot find task' });
    }
    res.json(task);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Create one task
router.post('/', auth, canCreateTask, async (req: AuthRequest, res: Response) => {
  const task = new Task({
    title: req.body.title,
    description: req.body.description,
    project: req.body.project,
    assignee: req.body.assignee || req.userId,
    status: req.body.status || 'To Do',
    priority: req.body.priority || 'Medium',
    dueDate: req.body.dueDate,
    reporter: req.userId,
  });

  try {
    const newTask = await task.save();
    res.status(201).json(newTask);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Update one task
router.patch('/:id', auth, canEditTask, async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (task == null) {
      return res.status(404).json({ message: 'Cannot find task' });
    }

    if (req.body.title != null) {
      task.title = req.body.title;
    }
    if (req.body.description != null) {
      task.description = req.body.description;
    }
    if (req.body.assignee != null) {
      task.assignee = req.body.assignee;
    }
    if (req.body.status != null) {
      task.status = req.body.status;
    }
    if (req.body.dueDate != null) {
      task.dueDate = req.body.dueDate;
    }

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Delete one task
router.delete('/:id', auth, canEditTask, async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (task == null) {
      return res.status(404).json({ message: 'Cannot find task' });
    }
    await task.deleteOne();
    res.json({ message: 'Deleted task' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
