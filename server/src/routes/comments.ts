import { Router, Request, Response } from 'express';
import Comment from '../models/Comment';
import { auth } from '../middleware/auth';

const router = Router();

// Get all comments for a task
router.get('/task/:taskId', auth, async (req: Request, res: Response) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'username email')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new comment
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const comment = new Comment({
      ...req.body,
      author: (req as any).userId,
    });
    
    const newComment = await comment.save();
    const populatedComment = await Comment.findById(newComment._id)
      .populate('author', 'username email');
    res.status(201).json(populatedComment);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Update a comment
router.patch('/:id', auth, async (req: Request, res: Response) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    comment.content = req.body.content;
    const updatedComment = await comment.save();
    res.json(updatedComment);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a comment
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
