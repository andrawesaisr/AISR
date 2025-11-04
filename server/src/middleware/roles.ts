import { Response, NextFunction } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from './auth';

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin role required' });
  }
  next();
};

export const isOwner = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { organizationId, id } = req.params;
  const orgId = organizationId || id;
  const userId = req.userId;

  if (!orgId || !userId) {
    return res.status(400).json({ message: 'Organization and user must be specified' });
  }

  try {
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true },
    });

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
      select: { role: true },
    });

    if (!membership || membership.role !== 'OWNER') {
      return res.status(403).json({ message: 'Owner role required' });
    }

    next();
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to verify organization ownership' });
  }
};

export const isMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { organizationId, id } = req.params;
  const orgId = organizationId || id;
  const userId = req.userId;

  if (!orgId || !userId) {
    return res.status(400).json({ message: 'Organization and user must be specified' });
  }

  try {
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true },
    });

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
      select: { role: true },
    });

    if (!membership) {
      return res
        .status(403)
        .json({ message: 'You are not a member of this organization' });
    }

    next();
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to verify organization membership' });
  }
};
