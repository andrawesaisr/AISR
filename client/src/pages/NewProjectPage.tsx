import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderPlus, Building2, Users, Target, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { createProject } from '../services/api';
import { useOrganization } from '../context/OrganizationContext';
import PageHeader from '../components/PageHeader';
import { getErrorMessage } from '../utils/errors';

const NewProjectPage: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [organization, setOrganization] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { organizations, fetchOrganizations } = useOrganization();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (!organization && organizations.length === 1) {
      setOrganization(organizations[0]._id);
    }
  }, [organization, organizations]);

  const selectedOrg = useMemo(
    () => organizations.find((org) => org._id === organization),
    [organization, organizations]
  );
  const availableMembers = selectedOrg?.members || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const projectData: any = { name, description };
      if (organization) {
        projectData.organization = organization;
      }
      if (selectedMembers.length > 0) {
        projectData.members = selectedMembers;
      }
      const project = await createProject(projectData);
      toast.success('Project created successfully!');
      navigate(`/projects/${project._id}`);
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, 'Failed to create project'));
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Create project"
        subtitle="Stand up a fresh workspace for your next initiative and bring collaborators in with context."
        actions={
          <Link to="/projects" className="btn-secondary">
            Back to projects
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6 rounded-2xl border border-neutral-300 bg-white p-8 shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="name" className="mb-2 block text-12 font-semibold uppercase tracking-wide text-neutral-700">
                  Project name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="input-field rounded-xl border-2 border-neutral-300 bg-neutral-100 focus:bg-white"
                  placeholder="Customer onboarding revamp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className="mb-2 block text-12 font-semibold uppercase tracking-wide text-neutral-700">
                  Summary
                </label>
                <textarea
                  id="description"
                  className="input-field min-h-[140px] rounded-xl border-2 border-neutral-300 bg-neutral-100 py-3 focus:bg-white"
                  placeholder="Describe what this project will deliver and how success will be measured."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="organization" className="mb-2 flex items-center gap-2 text-12 font-semibold uppercase tracking-wide text-neutral-700">
                  <Building2 size={16} />
                  Organization
                </label>
                <select
                  id="organization"
                  className="input-field rounded-xl border-2 border-neutral-300 bg-neutral-100 focus:bg-white"
                  value={organization}
                  onChange={(e) => {
                    setOrganization(e.target.value);
                    setSelectedMembers([]);
                  }}
                >
                  <option value="">Personal project</option>
                  {organizations.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name} • {org.members.length} member{org.members.length === 1 ? '' : 's'}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-11 text-neutral-600">
                  Link to an organization to inherit members, permissions, and shared rituals.
                </p>
              </div>
            </div>

            {organization && availableMembers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-12 font-semibold uppercase tracking-wide text-neutral-700">
                    Add teammates (optional)
                  </p>
                  <span className="text-11 text-neutral-600">
                    {selectedMembers.length} selected
                  </span>
                </div>
                <div className="max-h-52 space-y-2 overflow-y-auto rounded-2xl border border-neutral-300 bg-neutral-50 p-3">
                  {availableMembers.map((member) => (
                    <label
                      key={member.user._id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent bg-white px-3 py-2 transition hover:border-jira-300 hover:bg-jira-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.user._id)}
                        onChange={() => toggleMember(member.user._id)}
                        className="h-4 w-4 rounded border-neutral-400 text-jira-500 focus:ring-jira-500"
                      />
                      <div className="flex flex-1 items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-jira-500 to-status-purple text-12 font-semibold text-white">
                          {member.user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{member.user.username}</p>
                          <p className="text-xs text-neutral-600">{member.user.email}</p>
                        </div>
                      </div>
                      <span className="pill bg-neutral-200 text-neutral-700 capitalize">
                        {member.role}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2 text-14 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FolderPlus size={18} />
                {loading ? 'Creating...' : 'Create project'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4 rounded-2xl border border-neutral-300 bg-white p-6 shadow-soft">
          {organizations.length === 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-100/80 p-4">
              <h3 className="text-sm font-semibold text-neutral-900">No workspace yet</h3>
              <p className="mt-1 text-xs text-neutral-600">
                Create an organization to invite teammates and manage shared projects. You can do this from the Organizations page anytime.
              </p>
              <Link
                to="/organizations"
                className="mt-3 inline-flex items-center gap-1 text-12 font-semibold text-jira-600 hover:text-jira-500"
              >
                Go to organizations
              </Link>
            </div>
          )}
          <div className="rounded-2xl border border-jira-200 bg-jira-50/60 p-5">
            <div className="flex items-start gap-3">
              <Target size={20} className="mt-1 text-jira-600" />
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Kickoff checklist</h3>
                <p className="mt-1 text-xs text-neutral-600">
                  Document goals, align milestones, and capture project scope so teammates can jump in confidently.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-100 p-5">
            <div className="flex items-start gap-3">
              <Calendar size={20} className="mt-1 text-neutral-700" />
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Set the rhythm</h3>
                <p className="mt-1 text-xs text-neutral-600">
                  Pair this project with rituals: weekly sync notes, retro docs, and milestone trackers to stay aligned.
                </p>
              </div>
            </div>
          </div>

          {selectedOrg && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-neutral-900">{selectedOrg.name}</h3>
              <p className="mt-1 text-xs text-neutral-600">
                Members will inherit access to this project. Adjust roles later from the team tab.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {availableMembers.slice(0, 6).map((member) => (
                  <span key={member.user._id} className="pill bg-neutral-200 text-neutral-700">
                    {member.user.username}
                  </span>
                ))}
                {availableMembers.length > 6 && (
                  <span className="pill bg-neutral-200 text-neutral-700">
                    +{availableMembers.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewProjectPage;
