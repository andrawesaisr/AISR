import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrganization } from '../context/OrganizationContext';
import { 
  Building2, 
  ArrowLeft,
  Users, 
  Mail, 
  UserPlus, 
  Trash2, 
  Crown,
  Shield,
  User,
  Copy,
  Check,
  X,
  Clock,
  ClipboardList,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const OrganizationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    currentOrganization, 
    loading, 
    fetchOrganization,
    inviteMember,
    removeMember,
    updateMemberRole,
    cancelInvitation,
  } = useOrganization();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    if (!currentOrganization) {
      return { memberCount: 0, adminCount: 0, pendingInvites: 0 };
    }
    const memberCount = currentOrganization.members.filter((member: any) => member.user).length;
    const adminCount = currentOrganization.members.filter(
      (member: any) => member.user && (member.role === 'admin' || member.role === 'owner')
    ).length;
    const pendingInvites = currentOrganization.invitations.filter((inv: any) => inv.status === 'pending').length;
    return { memberCount, adminCount, pendingInvites };
  }, [currentOrganization]);

  const pendingInvitations = useMemo(
    () =>
      currentOrganization?.invitations.filter((inv: any) => inv.status === 'pending') || [],
    [currentOrganization]
  );

  useEffect(() => {
    if (id) {
      fetchOrganization(id);
    }
  }, [id]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      const result = await inviteMember(id, inviteEmail, inviteRole);
      
      if (result.inviteLink) {
        // Email not configured, show link
        setInviteLink(result.inviteLink);
      } else {
        // Email sent successfully
        alert('Invitation sent successfully!');
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('member');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to send invitation');
    }
  };

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRemoveMember = async (userId: string, username: string) => {
    if (!id) return;
    if (window.confirm(`Remove ${username} from the organization?`)) {
      try {
        await removeMember(id, userId);
      } catch (error) {
        console.error('Error removing member:', error);
      }
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'member') => {
    if (!id) return;
    try {
      await updateMemberRole(id, userId, newRole);
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    if (!id) return;
    if (window.confirm(`Cancel invitation for ${email}?`)) {
      try {
        await cancelInvitation(id, invitationId);
      } catch (error) {
        console.error('Error canceling invitation:', error);
      }
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown size={16} className="text-yellow-500" />;
      case 'admin':
        return <Shield size={16} className="text-blue-500" />;
      default:
        return <User size={16} className="text-gray-500" />;
    }
  };

  if (loading && !currentOrganization) {
    return <LoadingState label="Loading organization..." />;
  }

  if (!currentOrganization) {
    return (
      <EmptyState
        icon={Building2}
        title="Organization not found"
        description="This organization may have been removed or you might not have access."
        action={
          <button onClick={() => navigate('/organizations')} className="btn-primary flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to organizations
          </button>
        }
      />
    );
  }

  const userMember = currentOrganization.members.find(m => m.user._id);
  const canInvite = userMember?.role === 'owner' || userMember?.role === 'admin' || 
                    (userMember?.role === 'member' && currentOrganization.settings?.allowMemberInvite);
  const canManageMembers = userMember?.role === 'owner' || userMember?.role === 'admin';

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <PageHeader
        title={currentOrganization.name}
        subtitle={
          currentOrganization.description ||
          'Organize teams, share projects, and manage collaboration.'
        }
        actions={
          canInvite ? (
            <button onClick={() => setShowInviteModal(true)} className="btn-primary flex items-center gap-2">
              <UserPlus size={18} />
              Invite member
            </button>
          ) : undefined
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-11 text-neutral-600">
          <span className="pill bg-neutral-200 text-neutral-700">
            {getRoleIcon(userMember?.role || 'member')}
            {userMember?.role || 'member'}
          </span>
          <span className="pill bg-neutral-200 text-neutral-700">
            Created {new Date(currentOrganization.createdAt).toLocaleDateString()}
          </span>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Members"
          value={stats.memberCount}
          icon={Users}
          tone="blue"
          description="Active collaborators in this org."
        />
        <StatCard
          title="Admins & owners"
          value={stats.adminCount}
          icon={Shield}
          tone="purple"
          description="People who can manage access."
        />
        <StatCard
          title="Pending invites"
          value={stats.pendingInvites}
          icon={ClipboardList}
          tone="amber"
          description="Awaiting acceptance."
        />
      </div>

      {/* Members Section */}
      <div className="rounded-3xl border border-neutral-300 bg-white/90 p-6 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-18 font-semibold text-neutral-1000">
              Members ({stats.memberCount})
            </h2>
            <p className="text-12 text-neutral-600">
              Manage access and keep everyone aligned on responsibilities.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {currentOrganization.members.filter((member: any) => member.user).map((member: any) => (
            <div
              key={member.user._id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 transition hover:border-neutral-300 hover:bg-neutral-100"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-jira-500 to-status-purple text-13 font-semibold text-white">
                  {member.user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-14 font-semibold text-neutral-1000">{member.user.username}</span>
                    {getRoleIcon(member.role)}
                  </div>
                  <p className="text-12 text-neutral-600">{member.user.email}</p>
                  {member.user.jobTitle && (
                    <p className="text-11 text-neutral-500">{member.user.jobTitle}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canManageMembers && member.role !== 'owner' ? (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.user._id, e.target.value as 'admin' | 'member')}
                      className="input-field w-auto rounded-xl border-2 border-neutral-300 bg-neutral-100 text-12 font-semibold uppercase tracking-wide focus:bg-white"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.user._id, member.user.username)}
                      className="rounded-xl border border-red-200 p-2 text-status-red transition hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <span className="pill bg-neutral-200 text-neutral-700 capitalize">
                    {member.role}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {pendingInvitations.length > 0 && (
        <div className="rounded-3xl border border-neutral-300 bg-white/90 p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <Mail size={20} className="text-status-yellow" />
            <div>
              <h2 className="text-18 font-semibold text-neutral-1000">
                Pending invitations ({pendingInvitations.length})
              </h2>
              <p className="text-12 text-neutral-600">
                These invites are waiting to be accepted.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {pendingInvitations.map((invitation: any) => (
              <div
                key={invitation._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-yellow-200 bg-yellow-50/80 px-4 py-3"
              >
                <div>
                  <p className="text-13 font-semibold text-neutral-1000">{invitation.email}</p>
                  <p className="text-12 text-neutral-600">
                    Invited by {invitation.invitedBy.username} • {invitation.role}
                  </p>
                  <p className="flex items-center gap-1 text-11 text-neutral-500">
                    <Clock size={12} />
                    Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                {canManageMembers && (
                  <button
                    onClick={() => handleCancelInvitation(invitation._id, invitation.email)}
                    className="rounded-xl border border-red-200 p-2 text-status-red transition hover:bg-red-50"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showInviteModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowInviteModal(false);
            setInviteEmail('');
            setInviteRole('member');
            setInviteLink(null);
            setCopied(false);
          }}
        >
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-neutral-200 px-6 py-5">
              <h2 className="text-24 font-semibold text-neutral-1000">Invite member</h2>
              <p className="mt-1 text-12 text-neutral-600">
                Send an invite to bring teammates into this organization.
              </p>
            </div>
            {inviteLink ? (
              <div className="space-y-4 px-6 py-6">
                <p className="text-12 text-neutral-600">
                  Email configuration is unavailable. Share this link directly with the person you’d like to invite.
                </p>
                <div className="rounded-2xl border border-neutral-300 bg-neutral-100 p-4 text-12 break-all">
                  {inviteLink}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleCopyLink} className="btn-primary flex flex-1 items-center justify-center gap-2">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteEmail('');
                      setInviteRole('member');
                      setInviteLink(null);
                      setCopied(false);
                    }}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteMember} className="space-y-5 px-6 py-6">
                <div>
                  <label className="mb-2 block text-12 font-semibold uppercase tracking-wide text-neutral-700">
                    Email address *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input-field rounded-xl border-2 border-neutral-300 bg-neutral-100 focus:bg-white"
                    placeholder="colleague@example.com"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-12 font-semibold uppercase tracking-wide text-neutral-700">
                    Role *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                    className="input-field rounded-xl border-2 border-neutral-300 bg-neutral-100 focus:bg-white"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="mt-1 text-11 text-neutral-600">
                    {inviteRole === 'admin'
                      ? 'Admins can invite new members and manage roles.'
                      : 'Members can collaborate on projects and documents.'}
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteEmail('');
                      setInviteRole('member');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex items-center gap-2">
                    <Mail size={16} />
                    Send invitation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationPage;
