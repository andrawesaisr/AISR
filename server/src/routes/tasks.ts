import { Router, Response } from 'express';
import prisma, { Prisma } from '../prismaClient';
import { auth, AuthRequest } from '../middleware/auth';
import {
  isTaskMember,
  canEditTask,
  canCreateTask,
  canViewProjectTasks,
} from '../middleware/checkTaskAuth';

const router = Router();

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

const TASK_INCLUDE = {
  assignee: { select: USER_PUBLIC_SELECT },
  reporter: { select: USER_PUBLIC_SELECT },
  sprint: true,
};

const parseDateInput = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Get all tasks for a project
router.get(
  '/project/:projectId',
  auth,
  canViewProjectTasks,
  async (req: AuthRequest, res: Response) => {
    try {
      const tasks = await prisma.task.findMany({
        where: { projectId: req.params.projectId },
        include: TASK_INCLUDE,
        orderBy: { createdAt: 'desc' },
      });
      res.json(tasks);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Unable to fetch tasks' });
    }
  }
);

// Get one task
router.get('/:id', auth, isTaskMember, async (req: AuthRequest, res: Response) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: TASK_INCLUDE,
    });

    if (!task) {
      return res.status(404).json({ message: 'Cannot find task' });
    }

    res.json(task);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to fetch task' });
  }
});

// Create one task
router.post('/', auth, canCreateTask, async (req: AuthRequest, res: Response) => {
  try {
    const assigneeId =
      typeof req.body.assignee === 'string' && req.body.assignee.trim().length > 0
        ? req.body.assignee
        : req.userId;

    const task = await prisma.task.create({
      data: {
        title: req.body.title,
        description: req.body.description,
        projectId: req.body.project,
        assigneeId: assigneeId ?? null,
        status: req.body.status || 'To Do',
        priority: req.body.priority || 'Medium',
        dueDate: parseDateInput(req.body.dueDate),
        reporterId: req.userId ?? null,
        tags: Array.isArray(req.body.tags) ? req.body.tags : [],
        attachments: Array.isArray(req.body.attachments) ? req.body.attachments : [],
        estimatedHours:
          req.body.estimatedHours !== undefined ? Number(req.body.estimatedHours) : undefined,
        actualHours:
          req.body.actualHours !== undefined ? Number(req.body.actualHours) : undefined,
        storyPoints:
          req.body.storyPoints !== undefined ? Number(req.body.storyPoints) : undefined,
        sprintId:
          typeof req.body.sprint === 'string' && req.body.sprint.trim().length > 0
            ? req.body.sprint
            : null,
        type: req.body.type || 'Task',
        epicLinkId:
          typeof req.body.epicLink === 'string' && req.body.epicLink.trim().length > 0
            ? req.body.epicLink
            : null,
      },
      include: TASK_INCLUDE,
    });

    res.status(201).json(task);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        return res.status(400).json({ message: 'Invalid project or user reference' });
      }
    }
    res.status(400).json({ message: err.message || 'Unable to create task' });
  }
});

// Update one task
router.patch('/:id', auth, canEditTask, async (req: AuthRequest, res: Response) => {
  try {
    const data: Prisma.TaskUpdateInput = {};

    if (req.body.title !== undefined) data.title = req.body.title;
    if (req.body.description !== undefined) data.description = req.body.description;
    if (req.body.assignee !== undefined) {
      const assigneeId =
        typeof req.body.assignee === 'string' && req.body.assignee.trim().length > 0
          ? req.body.assignee
          : null;
      data.assignee = assigneeId ? { connect: { id: assigneeId } } : { disconnect: true };
    }
    if (req.body.status !== undefined) data.status = req.body.status;
    if (req.body.priority !== undefined) data.priority = req.body.priority;

    if (req.body.dueDate !== undefined) {
      const dueDate = parseDateInput(req.body.dueDate);
      data.dueDate = dueDate;
    }

    if (req.body.tags !== undefined) {
      data.tags = Array.isArray(req.body.tags) ? req.body.tags : [];
    }

    if (req.body.attachments !== undefined) {
      data.attachments = Array.isArray(req.body.attachments) ? req.body.attachments : [];
    }

    if (req.body.estimatedHours !== undefined) {
      data.estimatedHours =
        req.body.estimatedHours === null ? null : Number(req.body.estimatedHours);
    }

    if (req.body.actualHours !== undefined) {
      data.actualHours = req.body.actualHours === null ? null : Number(req.body.actualHours);
    }

    if (req.body.storyPoints !== undefined) {
      data.storyPoints = req.body.storyPoints === null ? null : Number(req.body.storyPoints);
    }

    if (req.body.sprint !== undefined) {
      const sprintId =
        typeof req.body.sprint === 'string' && req.body.sprint.trim().length > 0
          ? req.body.sprint
          : null;
      data.sprint = sprintId ? { connect: { id: sprintId } } : { disconnect: true };
    }

    if (req.body.type !== undefined) {
      data.type = req.body.type;
    }

    if (req.body.epicLink !== undefined) {
      const epicLinkId =
        typeof req.body.epicLink === 'string' && req.body.epicLink.trim().length > 0
          ? req.body.epicLink
          : null;
      data.epicLink = epicLinkId ? { connect: { id: epicLinkId } } : { disconnect: true };
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data,
      include: TASK_INCLUDE,
    });

    res.json(task);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return res.status(404).json({ message: 'Cannot find task' });
      }
      if (err.code === 'P2003') {
        return res.status(400).json({ message: 'Invalid reference in update payload' });
      }
    }
    res.status(400).json({ message: err.message || 'Unable to update task' });
  }
});

// Delete one task
router.delete('/:id', auth, canEditTask, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.task.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Deleted task' });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({ message: 'Cannot find task' });
    }
    res.status(500).json({ message: err.message || 'Unable to delete task' });
  }
});

export default router;
