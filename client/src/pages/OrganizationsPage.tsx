import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '../context/OrganizationContext';
import { BuildingOffice2Icon as Building2, PlusIcon as Plus, UsersIcon as Users, CalendarIcon as Calendar, TrashIcon as Trash2 } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const OrganizationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { organizations, loading, createOrganization, deleteOrganization } = useOrganization();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const stats = useMemo(() => {
    const total = organizations.length;
    const totalMembers = organizations.reduce((sum, org) => sum + org.members.length, 0);
    const pendingInvites = organizations.reduce(
      (sum, org) => sum + (org.invitations || []).filter((inv: any) => inv.status === 'pending').length,
      0
    );
    const avgMembers = total === 0 ? 0 : Math.round(totalMembers / total);
    return { total, totalMembers, pendingInvites, avgMembers };
  }, [organizations]);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newOrg = await createOrganization(formData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
      navigate(`/organizations/${newOrg.id}`);
    } catch (error) {
      console.error('Error creating organization:', error);
    }
  };

  const handleDeleteOrganization = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await deleteOrganization(id);
      } catch (error) {
        console.error('Error deleting organization:', error);
      }
    }
  };

  if (loading && organizations.length === 0) {
    return <LoadingState label="Loading organizations..." />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <PageHeader
        title="Organizations"
        subtitle="Group people, manage membership, and share workspaces across teams."
        actions={
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-[18px] h-[18px]" />
            New organization
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Organizations"
          value={stats.total}
          icon={Building2}
          tone="blue"
          description="Spaces you collaborate in."
        />
        <StatCard
          title="Total members"
          value={stats.totalMembers}
          icon={Users}
          tone="purple"
          description={`Avg ${stats.avgMembers || 0} per org.`}
        />
        <StatCard
          title="Pending invites"
          value={stats.pendingInvites}
          icon={Plus}
          tone="amber"
          description="Awaiting acceptance."
        />
      </div>

      {organizations.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations yet"
          description="Spin up an organization to invite teammates and share projects."
          action={
            <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-[18px] h-[18px]" />
              Create organization
            </button>
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {organizations.map((org) => {
            const userMember = org.members.find((member: any) => member.user?._id);
            const isOwner = userMember?.role === 'owner';

            return (
              <div
                key={org.id}
                onClick={() => navigate(`/organizations/${org.id}`)}
                className="group flex h-full flex-col justify-between rounded-3xl border border-neutral-300 bg-white/90 p-6 shadow-jira transition hover:-translate-y-1 hover:shadow-jira-hover cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-jira-500 to-status-purple text-white">
                      <Building2 className="w-[22px] h-[22px]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-1000">{org.name}</h3>
                      <span className="text-11 uppercase tracking-wide text-neutral-600">
                        {userMember?.role || 'member'}
                      </span>
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteOrganization(org.id, org.name);
                      }}
                      className="rounded-xl border border-red-200 p-2 text-status-red opacity-0 transition group-hover:opacity-100 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {org.description && (
                  <p className="mt-4 text-13 text-neutral-700 line-clamp-3">{org.description}</p>
                )}
                <div className="mt-6 flex items-center justify-between text-12 text-neutral-600">
                  <span className="pill bg-neutral-200 text-neutral-700">
                    <Users className="w-3 h-3" />
                    {org.members.length} member{org.members.length === 1 ? '' : 's'}
                  </span>
                  <span className="pill bg-neutral-200 text-neutral-700">
                    <Calendar className="w-3 h-3" />
                    {new Date(org.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-neutral-200 px-6 py-5">
              <h2 className="text-24 font-semibold text-neutral-1000">Create organization</h2>
              <p className="mt-1 text-12 text-neutral-600">
                Give your team a shared space for projects, docs, and rituals.
              </p>
            </div>
            <form onSubmit={handleCreateOrganization} className="space-y-5 px-6 py-6">
              <div>
                <label className="mb-2 block text-12 font-semibold uppercase tracking-wide text-neutral-700">
                  Organization name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field rounded-xl border-2 border-neutral-300 bg-neutral-100 focus:bg-white"
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <label className="mb-2 block text-12 font-semibold uppercase tracking-wide text-neutral-700">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field min-h-[120px] rounded-xl border-2 border-neutral-300 bg-neutral-100 py-3 focus:bg-white"
                  placeholder="What does your organization focus on?"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', description: '' });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationsPage;
