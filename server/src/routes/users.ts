import { Router, Request, Response } from 'express';
import User from '../models/User';
import { auth } from '../middleware/auth';

const router = Router();

interface AuthRequest extends Request {
  userId?: string;
}

// Get all users (team members)
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const users = await User.find({}, '-password').sort({ username: 1 });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user profile
router.get('/me', auth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId, '-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Update user profile
router.patch('/me', auth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.username) user.username = req.body.username;
    if (req.body.email) user.email = req.body.email;
    if (req.body.jobTitle !== undefined) user.jobTitle = req.body.jobTitle;
    if (req.body.department !== undefined) user.department = req.body.department;
    if (req.body.avatar !== undefined) user.avatar = req.body.avatar;

    const updatedUser = await user.save();
    const { password, ...userResponse } = updatedUser.toObject();
    
    res.json(userResponse);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Update user role (admin/manager only)
router.patch('/:id/role', auth, async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.role) {
      user.role = req.body.role;
    }

    const updatedUser = await user.save();
    const { password, ...userResponse } = updatedUser.toObject();
    
    res.json(userResponse);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
