import { Router, Response } from 'express';
import prisma, { Prisma } from '../prismaClient';
import { auth, AuthRequest } from '../middleware/auth';
import { isProjectMember, isProjectOwner, validateProjectOrganization } from '../middleware/checkProjectAuth';

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

const PROJECT_INCLUDE = {
  owner: { select: USER_PUBLIC_SELECT },
  members: { select: USER_PUBLIC_SELECT },
  organization: {
    include: {
      members: {
        include: {
          user: { select: USER_PUBLIC_SELECT },
        },
      },
    },
  },
};

// Get all projects
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const where =
      req.user?.role === 'admin'
        ? undefined
        : {
            OR: [
              { ownerId: req.userId },
              {
                members: {
                  some: {
                    id: req.userId,
                  },
                },
              },
              {
                organization: {
                  members: {
                    some: {
                      userId: req.userId,
                    },
                  },
                },
              },
            ],
          };

    const projects = await prisma.project.findMany({
      where,
      include: PROJECT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to fetch projects' });
  }
});

// Get one project
router.get('/:id', auth, isProjectMember, async (req: AuthRequest, res: Response) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: PROJECT_INCLUDE,
    });

    if (!project) {
      return res.status(404).json({ message: 'Cannot find project' });
    }

    res.json(project);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to fetch project' });
  }
});

// Create one project
router.post('/', auth, validateProjectOrganization, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const requestedMembers: string[] = Array.isArray(req.body.members) ? req.body.members : [];
    if (!requestedMembers.includes(req.userId)) {
      requestedMembers.push(req.userId);
    }
    const uniqueMemberIds = Array.from(new Set(requestedMembers));

    const project = await prisma.project.create({
      data: {
        name: req.body.name,
        description: req.body.description,
        ownerId: req.userId,
        organizationId: req.body.organization ?? null,
        members: {
          connect: uniqueMemberIds.map((id) => ({ id })),
        },
      },
      include: PROJECT_INCLUDE,
    });

    res.status(201).json(project);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid organization or member reference' });
    }
    res.status(400).json({ message: err.message || 'Unable to create project' });
  }
});

// Update one project
router.patch('/:id', auth, isProjectOwner, async (req: AuthRequest, res: Response) => {
  try {
    const data: Prisma.ProjectUpdateInput = {};

    if (req.body.name !== undefined) {
      data.name = req.body.name;
    }
    if (req.body.description !== undefined) {
      data.description = req.body.description;
    }
    if (req.body.owner !== undefined) {
      data.owner = { connect: { id: req.body.owner } };
    }
    if (req.body.members !== undefined) {
      const memberIds: string[] = Array.isArray(req.body.members) ? req.body.members : [];
      const uniqueMemberIds = Array.from(new Set(memberIds));
      data.members = {
        set: uniqueMemberIds.map((id) => ({ id })),
      };
    }
    if (req.body.organization !== undefined) {
      data.organization =
        req.body.organization === null || req.body.organization === ''
          ? { disconnect: true }
          : { connect: { id: req.body.organization } };
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data,
      include: PROJECT_INCLUDE,
    });

    res.json(project);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return res.status(404).json({ message: 'Cannot find project' });
      }
      if (err.code === 'P2003') {
        return res.status(400).json({ message: 'Invalid reference in update payload' });
      }
    }
    res.status(400).json({ message: err.message || 'Unable to update project' });
  }
});

// Delete one project
router.delete('/:id', auth, isProjectOwner, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.project.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Deleted project' });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({ message: 'Cannot find project' });
    }
    res.status(500).json({ message: err.message || 'Unable to delete project' });
  }
});

export default router;
