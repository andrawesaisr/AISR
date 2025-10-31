
import { Router, Request, Response } from 'express';
import User from '../models/User';
import Organization from '../models/Organization';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();

// Register a new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, organization } = req.body;
    const shouldCreateOrg = organization?.name && organization.name.trim().length > 0;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    if (shouldCreateOrg) {
      user.role = 'owner';
    }

    let newUser;
    let createdOrganization;

    try {
      newUser = await user.save();

      if (shouldCreateOrg) {
        const org = new Organization({
          name: organization.name.trim(),
          description: organization.description,
          createdBy: newUser._id,
          members: [
            {
              user: newUser._id,
              role: 'owner',
              joinedAt: new Date(),
            },
          ],
          settings: {
            allowMemberInvite: organization.allowMemberInvite || false,
            requireApproval: organization.requireApproval || false,
          },
        });

        createdOrganization = await org.save();
      }
    } catch (creationError) {
      if (newUser && !createdOrganization) {
        await User.findByIdAndDelete(newUser._id);
      }
      throw creationError;
    }

    // Generate JWT token for the new user
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET as string, {
      expiresIn: '1h',
    });

    res.status(201).json({ token, userId: newUser._id, organization: createdOrganization });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Login a user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, {
      expiresIn: '1h',
    });

    res.json({ token, userId: user._id });
  } catch (err: any) {
    console.log("error: ", err)
    res.status(500).json({ message: err.message });
  }
});

export default router;
