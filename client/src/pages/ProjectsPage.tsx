import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getProjects } from '../services/api';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import { getErrorMessage } from '../utils/errors';

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await getProjects();
        setProjects(res);
      } catch (err) {
        console.error(err);
        toast.error(getErrorMessage(err, 'Failed to load projects'));
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const stats = useMemo(() => {
    const total = projects.length;
    const withOrganization = projects.filter((project) => !!project.organization).length;
    const personal = total - withOrganization;
    return { total, withOrganization, personal };
  }, [projects]);

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [projects, searchQuery]
  );

  if (loading) {
    return <LoadingState label="Loading projects..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Projects"
        subtitle="Plan, prioritize, and track everything your team is building."
        actions={
          <Link to="/new-project" className="btn-primary flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            New project
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="All projects"
          value={stats.total}
          icon={FolderIcon}
          tone="blue"
          description="Workspace-wide visibility."
        />
        <StatCard
          title="Linked to organizations"
          value={stats.withOrganization}
          icon={UserGroupIcon}
          tone="purple"
          description="Shared with teams you collaborate with."
        />
        <StatCard
          title="Personal spaces"
          value={stats.personal}
          icon={CalendarIcon}
          tone="amber"
          description="Your lightweight focus areas."
        />
      </div>

      <div className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-soft">
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search projects by name..."
            className="input-field w-full rounded-xl border-2 border-neutral-200 bg-neutral-100 pl-12 pr-4 text-14 focus:bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderIcon}
          title={searchQuery ? 'No projects match your search' : 'No projects yet'}
          description={
            searchQuery
              ? 'Try a different project name or clear the search to browse everything.'
              : 'Spin up your first project to bring tasks, discussions, and context together.'
          }
          action={
            searchQuery ? (
              <button
                className="btn-secondary"
                onClick={() => setSearchQuery('')}
                type="button"
              >
                Clear search
              </button>
            ) : (
              <Link to="/new-project" className="btn-primary flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                Create project
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="group flex h-full flex-col justify-between rounded-2xl border border-neutral-300 bg-white/80 p-5 shadow-jira transition-all duration-150 hover:-translate-y-1 hover:shadow-jira-hover"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-jira-50 text-jira-600">
                  <FolderIcon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-lg font-semibold text-neutral-1000">{project.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-700">
                    {project.description || 'No description yet. Add context to help collaborators jump in.'}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600">
                <span className="pill bg-neutral-200 text-neutral-800">
                  {project.organization?.name || 'Personal'}
                </span>
                <span className="text-11 text-neutral-600">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
