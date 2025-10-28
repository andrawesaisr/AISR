
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import Organization from '../models/Organization';

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin role required' });
  }
  next();
};

export const isOwner = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { organizationId, id } = req.params;
  const orgId = organizationId || id;
  const userId = req.userId;

  try {
    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const member = org.members.find(m => m.user.toString() === userId);
    if (!member || member.role !== 'owner') {
      return res.status(403).json({ message: 'Owner role required' });
    }

    next();
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const isMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { organizationId, id } = req.params;
  const orgId = organizationId || id;
  const userId = req.userId;

  try {
    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const member = org.members.find(m => m.user.toString() === userId);
    if (!member) {
      return res.status(403).json({ message: 'You are not a member of this organization' });
    }

    next();
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
