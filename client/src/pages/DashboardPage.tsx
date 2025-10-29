import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  FolderKanban,
  FileText,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  ClipboardList,
  CalendarClock,
  ArrowRight,
} from 'lucide-react';
import { getProjects, getDocuments, getTasksForProject } from '../services/api';

type TaskStats = {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  dueSoon: number;
};

type QuickAction = {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
};

const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    todo: 0,
    inProgress: 0,
    done: 0,
    dueSoon: 0,
  });
  const [projectTaskCounts, setProjectTaskCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsData, docsData] = await Promise.all([
          getProjects(),
          getDocuments(),
        ]);
        setProjects(projectsData);
        setDocuments(docsData);

        if (projectsData.length > 0) {
          const projectSubset = projectsData.slice(0, 4);
          const taskResponses = await Promise.all(
            projectSubset.map((project) =>
              getTasksForProject(project._id).catch((error) => {
                console.error(`Failed to load tasks for project ${project._id}`, error);
                return [];
              })
            )
          );

          const aggregatedTasks = taskResponses.flat();

          if (aggregatedTasks.length > 0) {
            const sortedTasks = [...aggregatedTasks].sort((a, b) => {
              const getComparableTime = (task: any) => {
                const baseDate = task.updatedAt || task.dueDate || task.createdAt;
                return baseDate ? new Date(baseDate).getTime() : 0;
              };
              return getComparableTime(b) - getComparableTime(a);
            });

            setRecentTasks(sortedTasks.slice(0, 6));

            const stats = aggregatedTasks.reduce(
              (acc, task) => {
                const status = (task.status || '').toLowerCase();
                if (status === 'done') {
                  acc.done += 1;
                } else if (status === 'in progress') {
                  acc.inProgress += 1;
                } else {
                  acc.todo += 1;
                }

                if (task.dueDate) {
                  const due = new Date(task.dueDate).getTime();
                  if (!Number.isNaN(due)) {
                    const diffDays = (due - Date.now()) / (1000 * 60 * 60 * 24);
                    if (diffDays >= 0 && diffDays <= 7 && status !== 'done') {
                      acc.dueSoon += 1;
                    }
                  }
                }

                const projectId =
                  typeof task.project === 'string'
                    ? task.project
                    : task.project?._id || task.project?.id;

                if (projectId) {
                  acc.counts[projectId] = (acc.counts[projectId] || 0) + 1;
                }

                acc.total += 1;
                return acc;
              },
              {
                total: 0,
                todo: 0,
                inProgress: 0,
                done: 0,
                dueSoon: 0,
                counts: {} as Record<string, number>,
              }
            );

            setTaskStats({
              total: stats.total,
              todo: stats.todo,
              inProgress: stats.inProgress,
              done: stats.done,
              dueSoon: stats.dueSoon,
            });
            setProjectTaskCounts(stats.counts);
          } else {
            setRecentTasks([]);
            setTaskStats({ total: 0, todo: 0, inProgress: 0, done: 0, dueSoon: 0 });
            setProjectTaskCounts({});
          }
        } else {
          setRecentTasks([]);
          setTaskStats({ total: 0, todo: 0, inProgress: 0, done: 0, dueSoon: 0 });
          setProjectTaskCounts({});
        }
      } catch (err) {
        console.error(err);
        setRecentTasks([]);
        setTaskStats({ total: 0, todo: 0, inProgress: 0, done: 0, dueSoon: 0 });
        setProjectTaskCounts({});
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }, []);

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).format(new Date()),
    []
  );

  const relativeFormatter = useMemo(
    () => new Intl.RelativeTimeFormat('en', { numeric: 'auto' }),
    []
  );

  const formatRelativeDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const due = new Date(dateString);
    if (Number.isNaN(due.getTime())) return null;
    const diffMs = due.getTime() - Date.now();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (Math.abs(diffDays) >= 1) {
      return relativeFormatter.format(diffDays, 'day');
    }

    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (Math.abs(diffHours) >= 1) {
      return relativeFormatter.format(diffHours, 'hour');
    }

    const diffMinutes = Math.round(diffMs / (1000 * 60));
    return relativeFormatter.format(diffMinutes, 'minute');
  };

  const getPriorityBadgeColor = (priority?: string) => {
    switch (priority) {
      case 'Urgent':
        return 'text-status-red bg-red-50';
      case 'High':
        return 'text-status-yellow bg-yellow-50';
      case 'Medium':
        return 'text-status-blue bg-blue-50';
      case 'Low':
        return 'text-status-gray bg-neutral-100';
      default:
        return 'text-status-gray bg-neutral-100';
    }
  };

  const projectLookup = useMemo(() => {
    const lookup: Record<string, any> = {};
    projects.forEach((project) => {
      lookup[project._id] = project;
    });
    return lookup;
  }, [projects]);

  const openTasks = Math.max(taskStats.total - taskStats.done, 0);
  const completionRate =
    taskStats.total === 0 ? 0 : Math.round((taskStats.done / taskStats.total) * 100);
  const activeProjects = Object.keys(projectTaskCounts).length;

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        to: '/new-project',
        title: 'Start a project',
        description: 'Create a space for your next initiative.',
        icon: FolderKanban,
        accent: 'from-jira-500 to-jira-400',
      },
      {
        to: '/documents',
        title: 'Capture notes',
        description: 'Draft meeting notes or plans in seconds.',
        icon: FileText,
        accent: 'from-status-purple to-jira-500',
      },
      {
        to: '/my-tasks',
        title: 'Review tasks',
        description: 'See what needs your focus today.',
        icon: ClipboardList,
        accent: 'from-status-blue to-jira-500',
      },
    ],
    []
  );

  const topProjects = useMemo(() => projects.slice(0, 5), [projects]);
  const recentDocuments = useMemo(() => documents.slice(0, 5), [documents]);

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-neutral-700">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-jira-500" />
        <p className="text-sm font-medium">Loading your workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-jira-600 via-jira-500 to-jira-400 px-6 py-8 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_55%)]" />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-12 uppercase tracking-[0.2em] text-white/70">{formattedDate}</p>
              <h1 className="mt-1 text-3xl font-semibold md:text-4xl">
                Good {greeting}, ready to make progress?
              </h1>
              <p className="mt-3 max-w-xl text-sm text-white/80">
                Keep momentum going by checking what needs attention and capturing today&apos;s ideas.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/new-project"
                  className="inline-flex items-center gap-2 rounded-jira bg-white px-4 py-2 text-sm font-medium text-jira-600 transition-colors duration-150 hover:bg-neutral-0"
                >
                  <Plus size={16} />
                  Start a project
                </Link>
                <Link
                  to="/my-tasks"
                  className="inline-flex items-center gap-2 rounded-jira border border-white/40 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-white/10"
                >
                  <ClipboardList size={16} />
                  Review tasks
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
              {[
                {
                  label: 'Projects',
                  value: projects.length,
                  icon: FolderKanban,
                },
                {
                  label: 'Documents',
                  value: documents.length,
                  icon: FileText,
                },
                {
                  label: 'Active tasks',
                  value: openTasks,
                  icon: ClipboardList,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex h-full flex-col justify-between rounded-xl bg-white/10 p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between text-white/80">
                    <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
                    <Icon size={18} />
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
                  <p className="text-11 text-white/70">Workspace total</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-12 text-neutral-700">Progress</p>
                <p className="text-24 font-semibold text-neutral-1000">{completionRate}%</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-jira-50 text-jira-600">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="mt-4 h-1.5 w-full rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-jira-500 transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="mt-2 text-12 text-neutral-700">
              {taskStats.total === 0
                ? 'Add tasks to start tracking completion.'
                : `${taskStats.done} of ${taskStats.total} tasks completed.`}
            </p>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-12 text-neutral-700">In progress</p>
                <p className="text-24 font-semibold text-neutral-1000">{taskStats.inProgress}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-status-blue">
                <ClipboardList size={20} />
              </div>
            </div>
            <p className="mt-4 text-sm text-neutral-700">
              Keep these tasks moving to maintain momentum.
            </p>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-12 text-neutral-700">Recently done</p>
                <p className="text-24 font-semibold text-neutral-1000">{taskStats.done}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-status-green">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <p className="mt-4 text-sm text-neutral-700">
              Celebrate the wins and share updates with the team.
            </p>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-12 text-neutral-700">Due soon</p>
                <p className="text-24 font-semibold text-neutral-1000">{taskStats.dueSoon}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50 text-status-yellow">
                <CalendarClock size={20} />
              </div>
            </div>
            <p className="mt-4 text-sm text-neutral-700">
              Tasks with deadlines in the next 7 days.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-neutral-1000 mb-4">Quick actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {quickActions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.to}
                className="group flex h-full flex-col justify-between rounded-2xl border border-neutral-300 bg-white p-5 transition-all duration-150 hover:-translate-y-1 hover:border-jira-400 hover:shadow-jira-hover"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${action.accent} text-white`}
                  >
                    <ActionIcon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-1000">{action.title}</p>
                    <p className="text-xs text-neutral-700">{action.description}</p>
                  </div>
                </div>
                <span className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-jira-600">
                  Go there
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-150 group-hover:translate-x-1"
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-1000">Recent projects</h2>
              <Link
                to="/projects"
                className="text-12 font-semibold text-jira-600 hover:text-jira-500"
              >
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {topProjects.map((project) => {
                const taskCount = projectTaskCounts[project._id] ?? 0;
                return (
                  <Link
                    key={project._id}
                    to={`/projects/${project._id}`}
                    className="flex items-start gap-3 rounded-lg border border-transparent px-3 py-3 transition-colors duration-150 hover:border-neutral-300 hover:bg-neutral-100"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-jira-50 text-jira-600">
                      <FolderKanban size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-neutral-1000">{project.name}</p>
                      <p className="text-xs text-neutral-700">{project.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="badge badge-progress">
                          {taskCount} task{taskCount === 1 ? '' : 's'}
                        </span>
                        {project.organization?.name && (
                          <span className="badge badge-todo">
                            {project.organization.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
              {projects.length === 0 && (
                <div className="text-center py-12 text-neutral-700">
                  <p className="font-medium">No projects yet.</p>
                  <p className="text-sm text-neutral-600">
                    Create your first project to start organizing work.
                  </p>
                  <Link to="/new-project" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-jira-600 hover:text-jira-500">
                    <Plus size={16} />
                    New project
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-1000">Recently updated documents</h2>
              <Link
                to="/documents"
                className="text-12 font-semibold text-jira-600 hover:text-jira-500"
              >
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentDocuments.map((doc) => (
                <Link
                  key={doc._id}
                  to={`/documents/${doc._id}`}
                  className="flex items-start gap-3 rounded-lg border border-transparent px-3 py-3 transition-colors duration-150 hover:border-neutral-300 hover:bg-neutral-100"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-purple/10 text-status-purple">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-1000">{doc.title}</p>
                    <p className="text-xs text-neutral-600">
                      Updated {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}
                    </p>
                    {doc.project && (
                      <p className="mt-1 text-xs text-neutral-700">
                        Linked to{' '}
                        {typeof doc.project === 'string'
                          ? projectLookup[doc.project]?.name || 'a project'
                          : doc.project?.name}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
              {documents.length === 0 && (
                <div className="text-center py-12 text-neutral-700">
                  <p className="font-medium">No documents yet.</p>
                  <p className="text-sm text-neutral-600">
                    Capture meeting notes or ideas to build momentum.
                  </p>
                  <Link to="/documents" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-jira-600 hover:text-jira-500">
                    <FileText size={16} />
                    Create document
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-1000">Recent tasks</h2>
            {activeProjects > 0 && (
              <span className="text-11 font-semibold uppercase tracking-wide text-neutral-600">
                {activeProjects} active project{activeProjects === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <div className="space-y-3">
            {recentTasks.map((task) => {
              const status = (task.status || '').toLowerCase();
              const dueLabel = formatRelativeDueDate(task.dueDate);
              const projectId =
                typeof task.project === 'string'
                  ? task.project
                  : task.project?._id || task.project?.id;
              const projectName =
                typeof task.project === 'object' && task.project
                  ? task.project.name
                  : projectId
                  ? projectLookup[projectId]?.name
                  : undefined;
              const TaskIcon =
                status === 'done' ? CheckCircle2 : status === 'in progress' ? Clock : Clock;

              return (
                <Link
                  key={task._id}
                  to={projectId ? `/projects/${projectId}` : '/projects'}
                  className="flex items-start gap-3 rounded-lg border border-transparent px-3 py-3 transition-colors duration-150 hover:border-neutral-300 hover:bg-neutral-100"
                >
                  <div
                    className={`mt-1 flex h-10 w-10 items-center justify-center rounded-lg ${
                      status === 'done'
                        ? 'bg-green-50 text-status-green'
                        : status === 'in progress'
                        ? 'bg-jira-50 text-jira-600'
                        : 'bg-neutral-200 text-neutral-800'
                    }`}
                  >
                    <TaskIcon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-1000">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-neutral-700">{task.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`badge ${
                          status === 'done'
                            ? 'badge-done'
                            : status === 'in progress'
                            ? 'badge-progress'
                            : 'badge-todo'
                        }`}
                      >
                        {task.status || 'To Do'}
                      </span>
                      {task.priority && (
                        <span
                          className={`priority-badge ${getPriorityBadgeColor(task.priority)}`}
                        >
                          {task.priority}
                        </span>
                      )}
                      {projectName && (
                        <span className="badge badge-todo">{projectName}</span>
                      )}
                      {dueLabel && (
                        <span className="badge badge-progress">{dueLabel}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
            {recentTasks.length === 0 && (
              <div className="text-center py-12 text-neutral-700">
                <p className="font-medium">No tasks yet.</p>
                <p className="text-sm text-neutral-600">
                  Create a task to track progress and share updates with teammates.
                </p>
                <Link to="/projects" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-jira-600 hover:text-jira-500">
                  <FolderKanban size={16} />
                  View projects
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
