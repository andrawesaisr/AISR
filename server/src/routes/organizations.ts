import { Router, Response } from 'express';
import crypto from 'crypto';
import prisma, { Prisma } from '../prismaClient';
import { auth, AuthRequest } from '../middleware/auth';
import { sendInvitationEmail } from '../utils/emailService';
import { isOwner, isMember } from '../middleware/roles';

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

const ORGANIZATION_MEMBER_INCLUDE = {
  user: { select: USER_PUBLIC_SELECT },
};

const ORGANIZATION_INVITATION_INCLUDE = {
  invitedBy: { select: USER_PUBLIC_SELECT },
};

const ORGANIZATION_INCLUDE = {
  createdBy: { select: USER_PUBLIC_SELECT },
  members: {
    include: ORGANIZATION_MEMBER_INCLUDE,
    orderBy: { joinedAt: 'desc' as const },
  },
  invitations: {
    include: ORGANIZATION_INVITATION_INCLUDE,
    orderBy: { createdAt: 'desc' as const },
  },
};

const fetchOrganization = (id: string) =>
  prisma.organization.findUnique({
    where: { id },
    include: ORGANIZATION_INCLUDE,
  });

type OrganizationWithRelations = Prisma.OrganizationGetPayload<{
  include: typeof ORGANIZATION_INCLUDE;
}>;

type OrganizationMemberWithUser = Prisma.OrganizationMemberGetPayload<{
  include: typeof ORGANIZATION_MEMBER_INCLUDE;
}>;

type OrganizationInvitationWithInviter = Prisma.OrganizationInvitationGetPayload<{
  include: typeof ORGANIZATION_INVITATION_INCLUDE;
}>;

// Get all organizations for current user
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const where =
      req.user?.role === 'admin'
        ? undefined
        : {
            members: {
              some: {
                userId: req.userId,
              },
            },
          };

    const organizations = await prisma.organization.findMany({
      where,
      include: ORGANIZATION_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    res.json(organizations);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to fetch organizations' });
  }
});

// Get one organization
router.get('/:id', auth, isMember, async (req: AuthRequest, res: Response) => {
  try {
    const organization = await fetchOrganization(req.params.id);

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json(organization);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to fetch organization' });
  }
});

// Create organization
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const organization = await prisma.$transaction(async (tx) => {
      const createdOrganization = await tx.organization.create({
        data: {
          name: req.body.name,
          description: req.body.description,
          createdById: req.userId!,
          allowMemberInvite: Boolean(req.body.allowMemberInvite),
          requireApproval: Boolean(req.body.requireApproval),
          members: {
            create: {
              userId: req.userId!,
              role: 'OWNER',
            },
          },
        },
        include: ORGANIZATION_INCLUDE,
      });

      if (req.user?.role !== 'admin') {
        await tx.user.update({
          where: { id: req.userId },
          data: { role: 'OWNER' },
        });
      }

      return createdOrganization;
    });

    res.status(201).json(organization);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return res.status(400).json({ message: 'Organization name already in use' });
    }
    res.status(400).json({ message: err.message || 'Unable to create organization' });
  }
});

// Update organization
router.patch('/:id', auth, isOwner, async (req: AuthRequest, res: Response) => {
  try {
    const data: Prisma.OrganizationUpdateInput = {};

    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.description !== undefined) data.description = req.body.description;
    if (req.body.settings) {
      const settings = req.body.settings;
      if (settings.allowMemberInvite !== undefined) {
        data.allowMemberInvite = Boolean(settings.allowMemberInvite);
      }
      if (settings.requireApproval !== undefined) {
        data.requireApproval = Boolean(settings.requireApproval);
      }
    }

    const organization = await prisma.organization.update({
      where: { id: req.params.id },
      data,
      include: ORGANIZATION_INCLUDE,
    });

    res.json(organization);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({ message: 'Organization not found' });
    }
    res.status(400).json({ message: err.message || 'Unable to update organization' });
  }
});

// Delete organization
router.delete('/:id', auth, isOwner, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.organization.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Organization deleted' });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({ message: 'Organization not found' });
    }
    res.status(500).json({ message: err.message || 'Unable to delete organization' });
  }
});

// Invite member to organization
router.post('/:id/invite', auth, isOwner, async (req: AuthRequest, res: Response) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required' });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: ORGANIZATION_MEMBER_INCLUDE,
        },
        invitations: true,
      },
    });

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const member = organization.members.find(
      (m: OrganizationMemberWithUser) => m.userId === req.userId
    );

    if (!member) {
      return res.status(403).json({ message: 'Not a member of this organization' });
    }

    const canInvite =
      member.role === 'OWNER' ||
      member.role === 'ADMIN' ||
      (member.role === 'MEMBER' && organization.allowMemberInvite);

    if (!canInvite) {
      return res.status(403).json({ message: 'Not authorized to invite members' });
    }

    const normalizedEmail = String(email).toLowerCase();

    const existingMember = organization.members.find(
      (m: OrganizationMemberWithUser) => m.user?.email?.toLowerCase() === normalizedEmail
    );

    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    const existingInvite = organization.invitations.find(
      (inv) => inv.email === normalizedEmail && inv.status === 'PENDING'
    );

    if (existingInvite) {
      return res.status(400).json({ message: 'Invitation already sent to this email' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.organizationInvitation.create({
      data: {
        organizationId: organization.id,
        email: normalizedEmail,
        role,
        invitedById: req.userId!,
        token,
        expiresAt,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteLink = `${frontendUrl}/invite/${token}`;

    const emailSent = await sendInvitationEmail({
      to: email,
      organizationName: organization.name,
      inviterName: req.user?.username || 'A team member',
      inviteLink,
      role,
    });

    res.status(201).json({
      message: emailSent
        ? 'Invitation sent successfully'
        : 'Invitation created (email not configured)',
      inviteLink: emailSent ? undefined : inviteLink,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Unable to invite member' });
  }
});

// Accept invitation
router.post('/invite/:token/accept', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const invitation = await prisma.organizationInvitation.findUnique({
      where: { token: req.params.token },
      include: {
        organization: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ message: 'Invitation already used or expired' });
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ message: 'Invitation has expired' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.email.toLowerCase() !== invitation.email) {
      return res
        .status(403)
        .json({ message: 'This invitation was sent to a different email address' });
    }

    const existingMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: invitation.organizationId,
          userId: req.userId,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ message: 'Already a member of this organization' });
    }

    await prisma.$transaction([
      prisma.organizationMember.create({
        data: {
          organizationId: invitation.organizationId,
          userId: req.userId,
          role: invitation.role,
        },
      }),
      prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    const organization = await fetchOrganization(invitation.organizationId);

    res.json({
      message: 'Successfully joined organization',
      organization,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Unable to accept invitation' });
  }
});

// Get invitation details (public - no auth required)
router.get('/invite/:token', async (req: AuthRequest, res: Response) => {
  try {
    const invitation = await prisma.organizationInvitation.findUnique({
      where: { token: req.params.token },
      include: {
        organization: {
          select: {
            name: true,
            description: true,
          },
        },
      },
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ message: 'Invitation already used or expired' });
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ message: 'Invitation has expired' });
    }

    res.json({
      organizationName: invitation.organization.name,
      organizationDescription: invitation.organization.description,
      role: invitation.role,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to fetch invitation' });
  }
});

// Remove member from organization
router.delete('/:id/members/:userId', auth, isOwner, async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.params.id;
    const targetUserId = req.params.userId;

    const targetMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMembership) {
      return res.status(404).json({ message: 'Member not found' });
    }

    if (targetMembership.role === 'OWNER') {
      return res.status(400).json({ message: 'Cannot remove organization owner' });
    }

    const requesterMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: req.userId!,
        },
      },
    });

    if (!requesterMembership || !['OWNER', 'ADMIN'].includes(requesterMembership.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await prisma.organizationMember.delete({
      where: {
        organizationId_userId: {
          organizationId,
          userId: targetUserId,
        },
      },
    });

    const organization = await fetchOrganization(organizationId);

    res.json(organization);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Unable to remove member' });
  }
});

// Update member role
router.patch(
  '/:id/members/:userId/role',
  auth,
  isOwner,
  async (req: AuthRequest, res: Response) => {
    try {
      const { role } = req.body;

      if (!role || !['ADMIN', 'MEMBER'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: req.params.id,
            userId: req.params.userId,
          },
        },
      });

      if (!membership) {
        return res.status(404).json({ message: 'Member not found' });
      }

      if (membership.role === 'OWNER') {
        return res.status(400).json({ message: 'Cannot change owner role' });
      }

      await prisma.organizationMember.update({
        where: {
          organizationId_userId: {
            organizationId: req.params.id,
            userId: req.params.userId,
          },
        },
        data: { role },
      });

      const organization = await fetchOrganization(req.params.id);

      res.json(organization);
    } catch (err: any) {
      res.status(400).json({ message: err.message || 'Unable to update member role' });
    }
  }
);

// Cancel invitation
router.delete(
  '/:id/invitations/:invitationId',
  auth,
  isOwner,
  async (req: AuthRequest, res: Response) => {
    try {
      const invitation = await prisma.organizationInvitation.findUnique({
        where: { id: req.params.invitationId },
        select: { organizationId: true },
      });

      if (!invitation || invitation.organizationId !== req.params.id) {
        return res.status(404).json({ message: 'Invitation not found' });
      }

      await prisma.organizationInvitation.delete({
        where: { id: req.params.invitationId },
      });

      const organization = await fetchOrganization(req.params.id);

      res.json(organization);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Unable to cancel invitation' });
    }
  }
);

export default router;
