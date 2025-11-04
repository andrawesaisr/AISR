import { Router, Response } from 'express';
import prisma, { Prisma } from '../prismaClient';
import { auth, AuthRequest } from '../middleware/auth';

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

const SPRINT_INCLUDE = {
  createdBy: { select: USER_PUBLIC_SELECT },
  project: true,
};

const TASK_INCLUDE = {
  assignee: { select: USER_PUBLIC_SELECT },
  reporter: { select: USER_PUBLIC_SELECT },
};

type TaskForStats = Prisma.TaskGetPayload<{
  select: {
    status: true;
    storyPoints: true;
  };
}>;

const parseDateInput = (value: unknown) => {
  if (!value) return undefined;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

// Get all sprints for a project
router.get('/project/:projectId', auth, async (req: AuthRequest, res: Response) => {
  try {
    const sprints = await prisma.sprint.findMany({
      where: { projectId: req.params.projectId },
      include: SPRINT_INCLUDE,
      orderBy: { startDate: 'desc' },
    });
    res.json(sprints);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to fetch sprints' });
  }
});

// Get sprint by ID with tasks
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id: req.params.id },
      include: SPRINT_INCLUDE,
    });

    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    const tasks = await prisma.task.findMany({
      where: { sprintId: sprint.id },
      include: TASK_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ sprint, tasks });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to fetch sprint' });
  }
});

// Create sprint
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const sprint = await prisma.sprint.create({
      data: {
        name: req.body.name,
        goal: req.body.goal,
        projectId: req.body.project,
        startDate: parseDateInput(req.body.startDate) ?? new Date(),
        endDate: parseDateInput(req.body.endDate) ?? new Date(),
        status: req.body.status || 'planning',
        createdById: req.userId,
      },
      include: SPRINT_INCLUDE,
    });

    res.status(201).json(sprint);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid project reference' });
    }
    res.status(400).json({ message: err.message || 'Unable to create sprint' });
  }
});

// Update sprint
router.patch('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const data: Prisma.SprintUpdateInput = {};

    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.goal !== undefined) data.goal = req.body.goal;
    if (req.body.startDate !== undefined) data.startDate = parseDateInput(req.body.startDate);
    if (req.body.endDate !== undefined) data.endDate = parseDateInput(req.body.endDate);
    if (req.body.status !== undefined) data.status = req.body.status;
    if (req.body.project !== undefined) {
      const projectId =
        typeof req.body.project === 'string' && req.body.project.trim().length > 0
          ? req.body.project
          : null;
      data.project = projectId ? { connect: { id: projectId } } : undefined;
    }

    const sprint = await prisma.sprint.update({
      where: { id: req.params.id },
      data,
      include: SPRINT_INCLUDE,
    });

    res.json(sprint);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return res.status(404).json({ message: 'Sprint not found' });
      }
      if (err.code === 'P2003') {
        return res.status(400).json({ message: 'Invalid project reference' });
      }
    }
    res.status(400).json({ message: err.message || 'Unable to update sprint' });
  }
});

// Start sprint
router.post('/:id/start', auth, async (req: AuthRequest, res: Response) => {
  try {
    const sprint = await prisma.sprint.findUnique({ where: { id: req.params.id } });
    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    const startDate =
      !sprint.startDate || sprint.startDate > new Date() ? new Date() : sprint.startDate;

    const updatedSprint = await prisma.sprint.update({
      where: { id: sprint.id },
      data: {
        status: 'ACTIVE',
        startDate,
      },
      include: SPRINT_INCLUDE,
    });

    res.json(updatedSprint);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Unable to start sprint' });
  }
});

// Complete sprint
router.post('/:id/complete', auth, async (req: AuthRequest, res: Response) => {
  try {
    const sprint = await prisma.sprint.findUnique({ where: { id: req.params.id } });
    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    const updatedSprint = await prisma.sprint.update({
      where: { id: sprint.id },
      data: {
        status: 'COMPLETED',
        endDate: new Date(),
      },
      include: SPRINT_INCLUDE,
    });

    res.json(updatedSprint);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Unable to complete sprint' });
  }
});

// Get sprint statistics (for burndown chart)
router.get('/:id/stats', auth, async (req: AuthRequest, res: Response) => {
  try {
    const sprint = await prisma.sprint.findUnique({ where: { id: req.params.id } });
    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    const tasks = await prisma.task.findMany({
      where: { sprintId: sprint.id },
      select: {
        status: true,
        storyPoints: true,
      },
    });

    const totalStoryPoints = tasks.reduce(
      (sum: number, task: TaskForStats) => sum + (task.storyPoints ?? 0),
      0
    );
    const completedStoryPoints = tasks
      .filter((task: TaskForStats) => task.status === 'DONE')
      .reduce((sum: number, task: TaskForStats) => sum + (task.storyPoints ?? 0), 0);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task: TaskForStats) => task.status === 'DONE').length;
    const inProgressTasks = tasks.filter(
      (task: TaskForStats) => task.status === 'IN_PROGRESS'
    ).length;
    const todoTasks = tasks.filter((task: TaskForStats) => task.status === 'TO_DO').length;

    const start = sprint.startDate ?? new Date();
    const end = sprint.endDate ?? new Date();
    const totalDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    const daysElapsed = Math.max(
      0,
      Math.ceil((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
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
    res.status(500).json({ message: err.message || 'Unable to compute sprint stats' });
  }
});

// Delete sprint
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const sprint = await prisma.sprint.findUnique({ where: { id: req.params.id } });
    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    await prisma.$transaction([
      prisma.task.updateMany({
        where: { sprintId: sprint.id },
        data: { sprintId: null },
      }),
      prisma.sprint.delete({
        where: { id: sprint.id },
      }),
    ]);

    res.json({ message: 'Sprint deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to delete sprint' });
  }
});

export default router;
