import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma, { Prisma } from '../prismaClient';

const router = Router();

const ensureJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
};

// Register a new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, organization } = req.body;
    const shouldCreateOrg = organization?.name && organization.name.trim().length > 0;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: shouldCreateOrg ? 'OWNER' : 'MEMBER',
        },
        select: {
          id: true,
        },
      });

      if (!shouldCreateOrg) {
        return { user, organization: null };
      }

      const createdOrganization = await tx.organization.create({
        data: {
          name: organization.name.trim(),
          description: organization.description,
          createdById: user.id,
          allowMemberInvite: Boolean(organization.allowMemberInvite),
          requireApproval: Boolean(organization.requireApproval),
          members: {
            create: [
              {
                role: 'OWNER',
                joinedAt: new Date(),
                user: {
                  connect: { id: user.id },
                },
              },
            ],
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  role: true,
                  avatar: true,
                  jobTitle: true,
                  department: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
      });

      return { user, organization: createdOrganization };
    });

    const token = jwt.sign({ userId: result.user.id }, ensureJwtSecret(), {
      expiresIn: '1h',
    });

    res.status(201).json({
      token,
      userId: result.user.id,
      organization: result.organization,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to register user' });
  }
});

// Login a user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, ensureJwtSecret(), {
      expiresIn: '1h',
    });

    res.json({ token, userId: user.id });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to login' });
  }
});

export default router;
