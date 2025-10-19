import React, { useEffect, useState } from 'react';
import { Users, Mail, Briefcase, Shield, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUsers, updateUserRole } from '../services/api';

const TeamPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      toast.success('Role updated successfully');
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-status-red text-white';
      case 'manager': return 'bg-jira-500 text-white';
      case 'member': return 'bg-neutral-200 text-neutral-800';
      default: return 'bg-neutral-200 text-neutral-800';
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jira-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-b border-neutral-300 -mx-8 -mt-8 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-24 font-semibold text-neutral-1000">Team Members</h1>
            <p className="text-12 text-neutral-700 mt-0.5">Manage your organization members and roles</p>
          </div>
          <button className="btn-primary gap-1">
            <UserPlus size={16} />
            Invite Member
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mt-4">
        <input
          type="text"
          placeholder="Search members..."
          className="input-field max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-jira-50 rounded-jira flex items-center justify-center">
              <Users className="text-jira-500" size={20} />
            </div>
            <div>
              <p className="text-11 text-neutral-700 uppercase font-semibold">Total Members</p>
              <p className="text-20 font-semibold text-neutral-1000">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-jira-50 rounded-jira flex items-center justify-center">
              <Shield className="text-jira-500" size={20} />
            </div>
            <div>
              <p className="text-11 text-neutral-700 uppercase font-semibold">Managers</p>
              <p className="text-20 font-semibold text-neutral-1000">
                {users.filter(u => u.role === 'manager' || u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-jira-50 rounded-jira flex items-center justify-center">
              <Briefcase className="text-jira-500" size={20} />
            </div>
            <div>
              <p className="text-11 text-neutral-700 uppercase font-semibold">Team Members</p>
              <p className="text-20 font-semibold text-neutral-1000">
                {users.filter(u => u.role === 'member').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="card p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-100 border-b border-neutral-300">
              <tr>
                <th className="text-left px-4 py-2 text-11 font-semibold text-neutral-800 uppercase">Member</th>
                <th className="text-left px-4 py-2 text-11 font-semibold text-neutral-800 uppercase">Email</th>
                <th className="text-left px-4 py-2 text-11 font-semibold text-neutral-800 uppercase">Job Title</th>
                <th className="text-left px-4 py-2 text-11 font-semibold text-neutral-800 uppercase">Department</th>
                <th className="text-left px-4 py-2 text-11 font-semibold text-neutral-800 uppercase">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-jira-500 rounded-full flex items-center justify-center text-white text-12 font-semibold">
                        {getInitials(user.username)}
                      </div>
                      <span className="text-14 font-medium text-neutral-1000">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-14 text-neutral-700">
                      <Mail size={14} />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-14 text-neutral-700">
                    {user.jobTitle || '-'}
                  </td>
                  <td className="px-4 py-3 text-14 text-neutral-700">
                    {user.department || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className={`px-2 py-1 rounded-jira text-11 font-semibold uppercase ${getRoleBadgeColor(user.role)}`}
                    >
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-16">
          <Users className="mx-auto text-neutral-400 mb-4" size={64} />
          <h3 className="text-20 font-semibold text-neutral-1000 mb-2">No members found</h3>
          <p className="text-14 text-neutral-700">
            {searchQuery ? 'Try a different search term' : 'Invite team members to get started'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TeamPage;
