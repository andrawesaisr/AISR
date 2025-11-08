import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardDocumentListIcon as ClipboardList, CheckCircleIcon as CheckCircle2, ClockIcon as Clock } from '@heroicons/react/24/outline';
import { getMyTasks } from '../services/api';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const MyTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await getMyTasks();
        setTasks(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.status === 'Done').length;
    const inProgress = tasks.filter((task) => task.status === 'In Progress').length;
    return { total, done, inProgress };
  }, [tasks]);

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const getTime = (task: any) =>
          task.dueDate ? new Date(task.dueDate).getTime() : new Date(task.updatedAt || task.createdAt).getTime();
        return getTime(a) - getTime(b);
      }),
    [tasks]
  );

  if (loading) {
    return <LoadingState label="Loading your tasks..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="My tasks"
        subtitle="Stay on top of what needs your attention and keep work moving."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Assigned to me"
          value={stats.total}
          icon={ClipboardList}
          tone="blue"
          description="All tasks where you are the owner."
        />
        <StatCard
          title="In progress"
          value={stats.inProgress}
          icon={Clock}
          tone="purple"
          description="Tasks currently underway."
        />
        <StatCard
          title="Completed"
          value={stats.done}
          icon={CheckCircle2}
          tone="green"
          description="Shipped and off your plate."
        />
      </div>

      {sortedTasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No tasks assigned"
          description="You’re all caught up. New work assigned to you will show up here."
        />
      ) : (
        <div className="space-y-4">
          {sortedTasks.map((task) => {
            const projectName = task.project?.name || 'Project';
            const dueDate = task.dueDate
              ? new Date(task.dueDate).toLocaleDateString()
              : null;
            return (
              <div
                key={task._id}
                className="rounded-2xl border border-neutral-300 bg-white/90 p-5 shadow-jira transition hover:border-jira-300 hover:shadow-jira-hover"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h3 className="text-14 font-semibold text-neutral-1000">{task.title}</h3>
                    {task.description && (
                      <p className="max-w-2xl text-12 text-neutral-700 line-clamp-3">
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge ${task.status === 'Done' ? 'badge-done' : task.status === 'In Progress' ? 'badge-progress' : 'badge-todo'}`}>
                        {task.status}
                      </span>
                      {task.priority && (
                        <span className="pill bg-neutral-200 text-neutral-700">
                          {task.priority}
                        </span>
                      )}
                      <span className="pill bg-neutral-200 text-neutral-700">{projectName}</span>
                      {dueDate && (
                        <span className="pill bg-neutral-200 text-neutral-700">
                          Due {dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-11 text-neutral-600">
                    Updated {new Date(task.updatedAt || task.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTasksPage;
