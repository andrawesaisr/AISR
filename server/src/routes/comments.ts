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

const COMMENT_INCLUDE = {
  author: { select: USER_PUBLIC_SELECT },
};

// Get all comments for a task
router.get('/task/:taskId', auth, async (req: AuthRequest, res: Response) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { taskId: req.params.taskId },
      include: COMMENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    res.json(comments);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to fetch comments' });
  }
});

// Create a new comment
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const comment = await prisma.comment.create({
      data: {
        content: req.body.content,
        taskId: req.body.task,
        authorId: req.userId,
        parentCommentId:
          typeof req.body.parentComment === 'string' && req.body.parentComment.trim().length > 0
            ? req.body.parentComment
            : null,
      },
      include: COMMENT_INCLUDE,
    });

    res.status(201).json(comment);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid task or parent comment reference' });
    }
    res.status(500).json({ message: err.message || 'Unable to create comment' });
  }
});

// Update a comment
router.patch('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const comment = await prisma.comment.update({
      where: { id: req.params.id },
      data: {
        content: req.body.content,
      },
      include: COMMENT_INCLUDE,
    });

    res.json(comment);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({ message: 'Comment not found' });
    }
    res.status(500).json({ message: err.message || 'Unable to update comment' });
  }
});

// Delete a comment
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.comment.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Comment deleted' });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({ message: 'Comment not found' });
    }
    res.status(500).json({ message: err.message || 'Unable to delete comment' });
  }
});

export default router;
