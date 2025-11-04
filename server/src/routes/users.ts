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

// Get all users
router.get('/', auth, async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: USER_PUBLIC_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to fetch users' });
  }
});

// Get my tasks
router.get('/my-tasks', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const tasks = await prisma.task.findMany({
      where: { assigneeId: req.userId },
      include: {
        project: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to fetch tasks' });
  }
});

// Get current user profile
router.get('/me', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: USER_PUBLIC_SELECT,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to fetch user profile' });
  }
});

// Update user profile
router.patch('/me', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (req.body.username !== undefined) updateData.username = req.body.username;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.jobTitle !== undefined) updateData.jobTitle = req.body.jobTitle;
    if (req.body.department !== undefined) updateData.department = req.body.department;
    if (req.body.avatar !== undefined) updateData.avatar = req.body.avatar;

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: USER_PUBLIC_SELECT,
    });

    res.json(updatedUser);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(400).json({ message: 'Email or username already in use' });
      }
      if (err.code === 'P2025') {
        return res.status(404).json({ message: 'User not found' });
      }
    }
    res.status(400).json({ message: err.message || 'Unable to update profile' });
  }
});

// Update user role (admin/owner only)
router.patch('/:id/role', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'OWNER')) {
      return res.status(403).json({ message: 'Not authorized to perform this action' });
    }

    if (!req.body.role || !['ADMIN', 'OWNER', 'MEMBER'].includes(req.body.role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: req.body.role },
      select: USER_PUBLIC_SELECT,
    });

    res.json(updatedUser);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(400).json({ message: err.message || 'Unable to update role' });
  }
});

export default router;
