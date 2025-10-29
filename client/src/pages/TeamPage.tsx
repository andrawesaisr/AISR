import React, { useEffect, useMemo, useState } from 'react';
import { Users, Mail, Briefcase, Shield, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUsers, updateUserRole } from '../services/api';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const TeamPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const stats = useMemo(() => {
    const total = users.length;
    const managers = users.filter((user) => user.role === 'manager' || user.role === 'admin').length;
    const members = users.filter((user) => user.role === 'member').length;
    return { total, managers, members };
  }, [users]);

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

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [users, searchQuery]
  );

  if (loading) {
    return <LoadingState label="Loading team members..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Team members"
        subtitle="View everyone in your workspace and adjust access levels."
        actions={
          <button className="btn-primary flex items-center gap-2">
            <UserPlus size={16} />
            Invite member
          </button>
        }
      />

      <div className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-soft">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search members..."
            className="input-field w-full rounded-xl border-2 border-neutral-200 bg-neutral-100 pl-4 pr-4 text-14 focus:bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total members"
          value={stats.total}
          icon={Users}
          tone="blue"
          description="People collaborating across projects."
        />
        <StatCard
          title="Managers & admins"
          value={stats.managers}
          icon={Shield}
          tone="purple"
          description="Teammates who can manage roles."
        />
        <StatCard
          title="Individual contributors"
          value={stats.members}
          icon={Briefcase}
          tone="neutral"
          description="Focused on executing the work."
        />
      </div>

      <div className="rounded-3xl border border-neutral-300 bg-white/90 p-0 shadow-soft">
        <div className="overflow-x-auto rounded-3xl">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-100 text-11 font-semibold uppercase tracking-wide text-neutral-700">
              <tr>
                <th className="px-4 py-3 text-left">Member</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Job title</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="transition hover:bg-neutral-100/70">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-jira-500 text-13 font-semibold text-white">
                        {getInitials(user.username)}
                      </div>
                      <span className="text-14 font-semibold text-neutral-1000">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-13 text-neutral-700">
                      <Mail size={14} />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-13 text-neutral-700">{user.jobTitle || '—'}</td>
                  <td className="px-4 py-4 text-13 text-neutral-700">{user.department || '—'}</td>
                  <td className="px-4 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className={`rounded-jira px-2 py-1 text-11 font-semibold uppercase ${getRoleBadgeColor(user.role)}`}
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
        <EmptyState
          icon={Users}
          title={searchQuery ? 'No members match your search' : 'No members found'}
          description={
            searchQuery
              ? 'Adjust your search terms or clear the filter to see everyone.'
              : 'Invite teammates to begin collaborating.'
          }
        />
      )}
    </div>
  );
};

export default TeamPage;
