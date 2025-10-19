import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrganization } from '../context/OrganizationContext';
import { 
  Building2, 
  Users, 
  Mail, 
  UserPlus, 
  Settings, 
  Trash2, 
  Crown,
  Shield,
  User,
  Copy,
  Check,
  X,
  Clock
} from 'lucide-react';

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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Organization not found</h2>
          <button
            onClick={() => navigate('/organizations')}
            className="mt-4 text-blue-500 hover:text-blue-700"
          >
            Back to Organizations
          </button>
        </div>
      </div>
    );
  }

  const userMember = currentOrganization.members.find(m => m.user._id);
  const canInvite = userMember?.role === 'owner' || userMember?.role === 'admin' || 
                    (userMember?.role === 'member' && currentOrganization.settings?.allowMemberInvite);
  const canManageMembers = userMember?.role === 'owner' || userMember?.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-4 rounded-lg">
              <Building2 size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{currentOrganization.name}</h1>
              {currentOrganization.description && (
                <p className="text-gray-600 mt-1">{currentOrganization.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-500">Your role:</span>
                <span className="flex items-center gap-1 text-sm font-medium capitalize">
                  {getRoleIcon(userMember?.role || 'member')}
                  {userMember?.role}
                </span>
              </div>
            </div>
          </div>
          {canInvite && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              <UserPlus size={20} />
              Invite Member
            </button>
          )}
        </div>
      </div>

      {/* Members Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users size={24} />
          Members ({currentOrganization.members.length})
        </h2>
        <div className="space-y-3">
          {currentOrganization.members.filter(member => member.user).map((member) => (
            <div
              key={member.user._id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {member.user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{member.user.username}</span>
                    {getRoleIcon(member.role)}
                  </div>
                  <span className="text-sm text-gray-500">{member.user.email}</span>
                  {member.user.jobTitle && (
                    <span className="text-xs text-gray-400 block">{member.user.jobTitle}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canManageMembers && member.role !== 'owner' && (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.user._id, e.target.value as 'admin' | 'member')}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.user._id, member.user.username)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
                {member.role === 'owner' && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
                    Owner
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      {currentOrganization.invitations.filter(inv => inv.status === 'pending').length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Mail size={24} />
            Pending Invitations ({currentOrganization.invitations.filter(inv => inv.status === 'pending').length})
          </h2>
          <div className="space-y-3">
            {currentOrganization.invitations
              .filter(inv => inv.status === 'pending')
              .map((invitation) => (
                <div
                  key={invitation._id}
                  className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <div className="flex items-center gap-3">
                    <Mail size={20} className="text-yellow-600" />
                    <div>
                      <div className="font-medium text-gray-900">{invitation.email}</div>
                      <div className="text-sm text-gray-500">
                        Invited by {invitation.invitedBy.username} • {invitation.role}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Clock size={12} />
                        Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {canManageMembers && (
                    <button
                      onClick={() => handleCancelInvitation(invitation._id, invitation.email)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Invite Member</h2>
            
            {inviteLink ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Email is not configured. Share this invitation link with the person you want to invite:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mb-4 break-all text-sm">
                  {inviteLink}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition mb-3"
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInviteRole('member');
                    setInviteLink(null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleInviteMember}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="colleague@example.com"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {inviteRole === 'admin' 
                      ? 'Admins can invite and manage members' 
                      : 'Members can view and collaborate'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteEmail('');
                      setInviteRole('member');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                  >
                    Send Invitation
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
