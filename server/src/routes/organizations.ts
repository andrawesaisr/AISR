import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import Organization from '../models/Organization';
import User from '../models/User';
import { auth } from '../middleware/auth';
import { sendInvitationEmail } from '../utils/emailService';

const router = Router();

interface AuthRequest extends Request {
  userId?: string;
}

// Get all organizations for current user
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const organizations = await Organization.find({
      'members.user': req.userId,
    })
      .populate('createdBy', '-password')
      .populate('members.user', '-password')
      .populate('invitations.invitedBy', '-password');
    
    // Filter out members with null user references for each organization
    organizations.forEach(org => {
      org.members = org.members.filter(m => m.user != null);
    });
    
    res.json(organizations);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get one organization
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const organization = await Organization.findById(req.params.id)
      .populate('createdBy', '-password')
      .populate('members.user', '-password')
      .populate('invitations.invitedBy', '-password');
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Filter out members with null user references (deleted users)
    organization.members = organization.members.filter(m => m.user != null);

    // Check if user is a member
    const isMember = organization.members.some(
      (m) => m.user && m.user._id.toString() === req.userId
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(organization);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Create organization
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const organization = new Organization({
      name: req.body.name,
      description: req.body.description,
      createdBy: req.userId,
      members: [
        {
          user: req.userId,
          role: 'owner',
          joinedAt: new Date(),
        },
      ],
      settings: {
        allowMemberInvite: req.body.allowMemberInvite || false,
        requireApproval: req.body.requireApproval || false,
      },
    });

    const newOrganization = await organization.save();
    const populated = await Organization.findById(newOrganization._id)
      .populate('createdBy', '-password')
      .populate('members.user', '-password');

    res.status(201).json(populated);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Update organization
router.patch('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const organization = await Organization.findById(req.params.id);
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Check if user is owner or admin
    const member = organization.members.find(
      (m) => m.user && m.user.toString() === req.userId
    );

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.body.name) organization.name = req.body.name;
    if (req.body.description !== undefined) organization.description = req.body.description;
    if (req.body.settings) {
      organization.settings = {
        ...organization.settings,
        ...req.body.settings,
      };
    }

    const updated = await organization.save();
    const populated = await Organization.findById(updated._id)
      .populate('createdBy', '-password')
      .populate('members.user', '-password');

    res.json(populated);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Delete organization
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const organization = await Organization.findById(req.params.id);
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Filter out members with null user references
    organization.members = organization.members.filter(m => m.user != null);

    // Only owner can delete
    const member = organization.members.find(
      (m) => m.user && m.user.toString() === req.userId
    );

    if (!member || member.role !== 'owner') {
      return res.status(403).json({ message: 'Only owner can delete organization' });
    }

    await organization.deleteOne();
    res.json({ message: 'Organization deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Invite member to organization
router.post('/:id/invite', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required' });
    }

    const organization = await Organization.findById(req.params.id)
      .populate('members.user', '-password');
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Filter out null user references
    organization.members = organization.members.filter(m => m.user != null);

    // Check if user has permission to invite
    const member = organization.members.find(
      (m) => m.user && m.user._id.toString() === req.userId
    );

    if (!member) {
      return res.status(403).json({ message: 'Not a member of this organization' });
    }

    const canInvite = 
      member.role === 'owner' || 
      member.role === 'admin' || 
      (member.role === 'member' && organization.settings?.allowMemberInvite);

    if (!canInvite) {
      return res.status(403).json({ message: 'Not authorized to invite members' });
    }

    // Check if user is already a member
    const existingMember = organization.members.find(
      (m: any) => m.user && m.user.email === email.toLowerCase()
    );

    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Check if there's already a pending invitation
    const existingInvite = organization.invitations.find(
      (inv) => inv.email === email.toLowerCase() && inv.status === 'pending'
    );

    if (existingInvite) {
      return res.status(400).json({ message: 'Invitation already sent to this email' });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Add invitation
    organization.invitations.push({
      email: email.toLowerCase(),
      role: role,
      invitedBy: req.userId as any,
      token,
      expiresAt,
      status: 'pending',
      createdAt: new Date(),
    });

    await organization.save();

    // Get inviter info
    const inviter = await User.findById(req.userId);
    
    // Send invitation email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteLink = `${frontendUrl}/invite/${token}`;

    const emailSent = await sendInvitationEmail({
      to: email,
      organizationName: organization.name,
      inviterName: inviter?.username || 'A team member',
      inviteLink,
      role,
    });

    res.status(201).json({
      message: emailSent 
        ? 'Invitation sent successfully' 
        : 'Invitation created (email not configured)',
      inviteLink: !emailSent ? inviteLink : undefined, // Return link if email failed
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Accept invitation
router.post('/invite/:token/accept', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.params;

    const organization = await Organization.findOne({
      'invitations.token': token,
    });

    if (!organization) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    const invitation = organization.invitations.find(
      (inv) => inv.token === token
    );

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already used or expired' });
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await organization.save();
      return res.status(400).json({ message: 'Invitation has expired' });
    }

    // Get user email
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if invitation email matches user email
    if (user.email.toLowerCase() !== invitation.email) {
      return res.status(403).json({ 
        message: 'This invitation was sent to a different email address' 
      });
    }

    // Check if already a member (filter out null users first)
    const existingMember = organization.members.find(
      (m) => m.user && m.user.toString() === req.userId
    );

    if (existingMember) {
      return res.status(400).json({ message: 'Already a member of this organization' });
    }

    // Add user as member
    console.log('Adding user to organization:', req.userId, 'with role:', invitation.role);
    organization.members.push({
      user: req.userId as any,
      role: invitation.role as any,
      joinedAt: new Date(),
    });

    // Mark invitation as accepted
    invitation.status = 'accepted';

    await organization.save();
    console.log('Organization saved. Total members:', organization.members.length);

    const populated = await Organization.findById(organization._id)
      .populate('createdBy', '-password')
      .populate('members.user', '-password')
      .populate('invitations.invitedBy', '-password');

    // Filter out members with null user references
    if (populated) {
      console.log('Before filtering - members:', populated.members.length);
      populated.members = populated.members.filter(m => m.user != null);
      console.log('After filtering - members:', populated.members.length);
    }

    res.json({
      message: 'Successfully joined organization',
      organization: populated,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Get invitation details (public - no auth required)
router.get('/invite/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const organization = await Organization.findOne({
      'invitations.token': token,
    }).populate('createdBy', 'username');

    if (!organization) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    const invitation = organization.invitations.find(
      (inv) => inv.token === token
    );

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already used or expired' });
    }

    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ message: 'Invitation has expired' });
    }

    res.json({
      organizationName: organization.name,
      organizationDescription: organization.description,
      role: invitation.role,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Remove member from organization
router.delete('/:id/members/:userId', auth, async (req: AuthRequest, res: Response) => {
  try {
    const organization = await Organization.findById(req.params.id);
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Filter out null user references
    organization.members = organization.members.filter(m => m.user != null);

    // Check if requester has permission
    const requester = organization.members.find(
      (m) => m.user && m.user.toString() === req.userId
    );

    if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Can't remove owner
    const targetMember = organization.members.find(
      (m) => m.user && m.user.toString() === req.params.userId
    );

    if (targetMember?.role === 'owner') {
      return res.status(400).json({ message: 'Cannot remove organization owner' });
    }

    // Remove member
    organization.members = organization.members.filter(
      (m) => m.user && m.user.toString() !== req.params.userId
    );

    await organization.save();

    const populated = await Organization.findById(organization._id)
      .populate('createdBy', '-password')
      .populate('members.user', '-password');

    res.json(populated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Update member role
router.patch('/:id/members/:userId/role', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;

    if (!role || !['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const organization = await Organization.findById(req.params.id);
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Filter out null user references
    organization.members = organization.members.filter(m => m.user != null);

    // Only owner can change roles
    const requester = organization.members.find(
      (m) => m.user && m.user.toString() === req.userId
    );

    if (!requester || requester.role !== 'owner') {
      return res.status(403).json({ message: 'Only owner can change member roles' });
    }

    // Find target member
    const targetMember = organization.members.find(
      (m) => m.user && m.user.toString() === req.params.userId
    );

    if (!targetMember) {
      return res.status(404).json({ message: 'Member not found' });
    }

    if (targetMember.role === 'owner') {
      return res.status(400).json({ message: 'Cannot change owner role' });
    }

    // Update role
    targetMember.role = role;
    await organization.save();

    const populated = await Organization.findById(organization._id)
      .populate('createdBy', '-password')
      .populate('members.user', '-password');

    res.json(populated);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Cancel invitation
router.delete('/:id/invitations/:invitationId', auth, async (req: AuthRequest, res: Response) => {
  try {
    const organization = await Organization.findById(req.params.id);
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Filter out null user references
    organization.members = organization.members.filter(m => m.user != null);

    // Check permission
    const member = organization.members.find(
      (m) => m.user && m.user.toString() === req.userId
    );

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Remove invitation
    organization.invitations = organization.invitations.filter(
      (inv) => inv._id?.toString() !== req.params.invitationId
    );

    await organization.save();

    const populated = await Organization.findById(organization._id)
      .populate('createdBy', '-password')
      .populate('members.user', '-password')
      .populate('invitations.invitedBy', '-password');

    res.json(populated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
