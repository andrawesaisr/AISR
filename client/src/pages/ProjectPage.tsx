import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  LayoutGrid,
  List,
  Calendar,
  MessageSquare,
  Trash2,
  GripVertical,
  ClipboardList,
  CheckCircle2,
  Clock,
  FolderKanban,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getProject, getTasksForProject, createTask, updateTask, deleteTask, getCommentsForTask, createComment, getUsers } from '../services/api';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const ProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const fetchTasks = async () => {
    try {
      if (id) {
        const res = await getTasksForProject(id);
        setTasks(res);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (id) {
          const res = await getProject(id);
          const projectData = res?.project ?? res;
          setProject(projectData);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProject();
    fetchTasks();
    fetchUsers();
  }, [id]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTask = await createTask({
        title: newTaskTitle,
        description: newTaskDesc,
        project: id!,
        assignee: newTaskAssignee || undefined,
        priority: newTaskPriority,
      });
      setTasks([...tasks, newTask]);
      setShowTaskModal(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskAssignee('');
      setNewTaskPriority('Medium');
      toast.success('Task created!');
    } catch (err) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId: string, updates: any) => {
    try {
      await updateTask(taskId, updates);
      fetchTasks();
      toast.success('Task updated!');
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(t => t._id !== taskId));
      setShowTaskDetail(false);
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const openTaskDetail = async (task: any) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
    try {
      const taskComments = await getCommentsForTask(task._id);
      setComments(taskComments);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newComment.trim()) return;
    try {
      const comment = await createComment({ content: newComment, task: selectedTask._id });
      setComments([comment, ...comments]);
      setNewComment('');
      toast.success('Comment added');
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    const task = tasks.find(t => t._id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks(tasks.map(t => 
      t._id === taskId ? { ...t, status: newStatus } : t
    ));

    try {
      await updateTask(taskId, { status: newStatus });
      toast.success(`Task moved to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update task');
      fetchTasks(); // Revert on error
    }
  };

  const columns = useMemo(
    () => ({
      'To Do': tasks.filter((task) => task.status === 'To Do'),
      'In Progress': tasks.filter((task) => task.status === 'In Progress'),
      'Done': tasks.filter((task) => task.status === 'Done'),
    }),
    [tasks]
  );

  const statusCounts = useMemo(
    () => ({
      todo: columns['To Do'].length,
      inProgress: columns['In Progress'].length,
      done: columns['Done'].length,
    }),
    [columns]
  );

  if (loading) {
    return <LoadingState label="Loading project..." />;
  }

  if (!project) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Project not found"
        description="This project may have been removed or you no longer have access."
        action={
          <button onClick={() => navigate('/projects')} className="btn-primary flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to projects
          </button>
        }
      />
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'text-status-red bg-red-50';
      case 'High': return 'text-status-yellow bg-yellow-50';
      case 'Medium': return 'text-status-blue bg-blue-50';
      case 'Low': return 'text-status-gray bg-neutral-100';
      default: return 'text-status-gray bg-neutral-100';
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={project.name}
        subtitle={
          project.description ||
          'Add a brief description so teammates know what success looks like.'
        }
        actions={
          <button onClick={() => setShowTaskModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            New task
          </button>
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-11 text-neutral-600">
          <button onClick={() => navigate('/projects')} className="btn-ghost flex items-center gap-2 text-11 font-semibold uppercase tracking-wide">
            <ArrowLeft size={14} />
            Back to projects
          </button>
          {project.organization?.name && (
            <span className="pill bg-neutral-200 text-neutral-800">
              <Users size={12} />
              {project.organization.name}
            </span>
          )}
          <span className="pill bg-neutral-200 text-neutral-700">
            Created {new Date(project.createdAt).toLocaleDateString()}
          </span>
          <span className="pill bg-neutral-200 text-neutral-700">
            {tasks.length} task{tasks.length === 1 ? '' : 's'}
          </span>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="To do"
          value={statusCounts.todo}
          icon={ClipboardList}
          tone="neutral"
          description="Ready to be picked up."
        />
        <StatCard
          title="In progress"
          value={statusCounts.inProgress}
          icon={Clock}
          tone="purple"
          description="Actively moving forward."
        />
        <StatCard
          title="Done"
          value={statusCounts.done}
          icon={CheckCircle2}
          tone="green"
          description="Celebrate the wins."
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white p-1">
          <button
            onClick={() => setView('board')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-14 font-medium transition ${
              view === 'board'
                ? 'bg-jira-500 text-white shadow-sm'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <LayoutGrid size={16} />
            Board
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-14 font-medium transition ${
              view === 'list'
                ? 'bg-jira-500 text-white shadow-sm'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <List size={16} />
            List
          </button>
        </div>
      </div>

      {/* Board View */}
      {view === 'board' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {Object.entries(columns).map(([status, statusTasks]) => (
              <DroppableColumn key={status} id={status} title={status} count={statusTasks.length}>
                <SortableContext items={statusTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3 min-h-[200px]">
                    {statusTasks.map((task) => (
                      <SortableTaskCard
                        key={task._id}
                        task={task}
                        onClick={() => openTaskDetail(task)}
                        getPriorityColor={getPriorityColor}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DroppableColumn>
            ))}
          </div>
          <DragOverlay>
            {activeId ? (
              <TaskCard
                task={tasks.find(t => t._id === activeId)!}
                getPriorityColor={getPriorityColor}
                isDragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="rounded-2xl border border-neutral-300 bg-white shadow-soft">
          {tasks.length > 0 ? (
            <div className="divide-y divide-neutral-200">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  onClick={() => openTaskDetail(task)}
                  className="flex flex-wrap items-start justify-between gap-4 p-5 transition hover:bg-neutral-100/60 cursor-pointer"
                >
                  <div className="space-y-2">
                    <h4 className="text-14 font-semibold text-neutral-1000">{task.title}</h4>
                    {task.description && (
                      <p className="text-12 text-neutral-700 line-clamp-2 max-w-2xl">
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge ${task.status === 'Done' ? 'badge-done' : task.status === 'In Progress' ? 'badge-progress' : 'badge-todo'}`}>
                        {task.status}
                      </span>
                      {task.priority && (
                        <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="pill bg-neutral-200 text-neutral-700">
                          <Calendar size={12} />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-12 text-neutral-600">
                    {task.assignee && (
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-jira-500 to-status-purple text-12 font-semibold text-white">
                          {task.assignee.username.charAt(0).toUpperCase()}
                        </div>
                        <span>{task.assignee.username}</span>
                      </div>
                    )}
                    <span>
                      Updated {new Date(task.updatedAt || task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16">
              <EmptyState
                icon={ClipboardList}
                title="No tasks yet"
                description="Kick off the project by creating tasks and assigning owners."
                action={
                  <button onClick={() => setShowTaskModal(true)} className="btn-primary flex items-center gap-2">
                    <Plus size={16} />
                    Create task
                  </button>
                }
              />
            </div>
          )}
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-neutral-200 px-6 py-5">
              <h2 className="text-24 font-semibold text-neutral-1000">Create task</h2>
              <p className="mt-1 text-12 text-neutral-600">
                Capture the work, add context, and assign an owner to keep momentum high.
              </p>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-6 px-6 py-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-12 font-semibold uppercase tracking-wide text-neutral-700">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field rounded-xl border-2 border-neutral-300 bg-neutral-100 focus:bg-white"
                    placeholder="e.g., Finalize launch checklist"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-12 font-semibold uppercase tracking-wide text-neutral-700">
                    Description
                  </label>
                  <textarea
                    className="input-field min-h-[120px] rounded-xl border-2 border-neutral-300 bg-neutral-100 py-3 focus:bg-white"
                    placeholder="Add acceptance criteria, links, or background details."
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-12 font-semibold uppercase tracking-wide text-neutral-700">
                      Assign to
                    </label>
                    <select
                      className="input-field rounded-xl border-2 border-neutral-300 bg-neutral-100 focus:bg-white"
                      value={newTaskAssignee}
                      onChange={(e) => setNewTaskAssignee(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.username} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-12 font-semibold uppercase tracking-wide text-neutral-700">
                      Priority
                    </label>
                    <select
                      className="input-field rounded-xl border-2 border-neutral-300 bg-neutral-100 focus:bg-white"
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex items-center gap-2">
                  <Plus size={16} />
                  Create task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {showTaskDetail && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowTaskDetail(false)}>
          <div className="modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-neutral-200 px-6 py-5">
              <div className="flex-1 space-y-3">
                <h2 className="text-24 font-semibold text-neutral-1000">{selectedTask.title}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedTask.status}
                    onChange={(e) => handleUpdateTask(selectedTask._id, { status: e.target.value })}
                    className="input-field w-auto rounded-xl border-2 border-neutral-300 bg-neutral-100 text-12 font-semibold uppercase tracking-wide focus:bg-white"
                  >
                    <option>To Do</option>
                    <option>In Progress</option>
                    <option>Done</option>
                  </select>
                  <select
                    value={selectedTask.priority || 'Medium'}
                    onChange={(e) => handleUpdateTask(selectedTask._id, { priority: e.target.value })}
                    className="input-field w-auto rounded-xl border-2 border-neutral-300 bg-neutral-100 text-12 font-semibold uppercase tracking-wide focus:bg-white"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                  <span className={`badge ${selectedTask.status === 'Done' ? 'badge-done' : selectedTask.status === 'In Progress' ? 'badge-progress' : 'badge-todo'}`}>
                    {selectedTask.status}
                  </span>
                  {selectedTask.priority && (
                    <span className={`priority-badge ${getPriorityColor(selectedTask.priority)}`}>
                      {selectedTask.priority}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDeleteTask(selectedTask._id)}
                className="rounded-xl border border-red-200 p-2 text-status-red transition hover:bg-red-50"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div className="space-y-8 px-6 py-6">
              <div className="space-y-2">
                <h3 className="text-14 font-semibold text-neutral-900">Description</h3>
                <p className="rounded-2xl border border-neutral-200 bg-neutral-100 p-4 text-13 text-neutral-700">
                  {selectedTask.description || 'No description yet.'}
                </p>
              </div>
              <div>
                <h3 className="flex items-center gap-2 text-14 font-semibold text-neutral-900">
                  <MessageSquare size={16} />
                  Comments ({comments.length})
                </h3>
                <form onSubmit={handleAddComment} className="mt-3 space-y-3">
                  <textarea
                    className="input-field min-h-[100px] rounded-xl border-2 border-neutral-300 bg-neutral-100 py-3 focus:bg-white"
                    placeholder="Share updates, decisions, or questions..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button type="submit" className="btn-primary flex items-center gap-2">
                      <MessageSquare size={16} />
                      Add comment
                    </button>
                  </div>
                </form>
                <div className="mt-6 space-y-3">
                  {comments.map((comment) => (
                    <div key={comment._id} className="rounded-2xl border border-neutral-200 bg-neutral-0 p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-13 font-semibold text-neutral-900">
                            {comment.author?.username || 'User'}
                          </span>
                        </div>
                        <span className="text-11 text-neutral-600">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-2 text-13 text-neutral-700">{comment.content}</p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-neutral-300 p-4 text-center text-12 text-neutral-600">
                      No comments yet. Start a thread to capture context.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Droppable Column Component
interface DroppableColumnProps {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({ id, title, count, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[280px] flex-col gap-3 rounded-2xl border border-neutral-300 bg-neutral-100/80 p-4 transition ${
        isOver ? 'border-jira-400 bg-jira-50/70 shadow-jira-hover' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-12 font-semibold uppercase tracking-wide text-neutral-700">{title}</h3>
        <span className="pill bg-neutral-200 text-neutral-700">{count}</span>
      </div>
      {children}
    </div>
  );
};

// Sortable Task Card Component
interface SortableTaskCardProps {
  task: any;
  onClick: () => void;
  getPriorityColor: (priority: string) => string;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({ task, onClick, getPriorityColor }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-2xl border border-neutral-300 bg-white p-4 shadow-jira transition ${
        isDragging ? 'opacity-70 shadow-xl' : 'hover:border-jira-400 hover:shadow-jira-hover'
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab text-neutral-400 opacity-0 transition group-hover:opacity-100 active:cursor-grabbing hover:text-neutral-600"
        >
          <GripVertical size={14} />
        </button>
        <div className="flex-1 space-y-2" onClick={onClick}>
          <h4 className="text-14 font-semibold text-neutral-1000 leading-tight">{task.title}</h4>
          {task.description && (
            <p className="text-12 text-neutral-700 line-clamp-2">{task.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge ${task.status === 'Done' ? 'badge-done' : task.status === 'In Progress' ? 'badge-progress' : 'badge-todo'}`}>
              {task.status}
            </span>
            {task.priority && (
              <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            )}
            {task.dueDate && (
              <span className="text-11 text-neutral-600 flex items-center gap-1">
                <Calendar size={10} />
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        {task.assignee && (
          <div className="flex items-center gap-1" title={`Assigned to ${task.assignee.username}`}>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-jira-500 to-status-purple text-11 font-semibold text-white">
              {task.assignee.username.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Task Card Component (for drag overlay)
interface TaskCardProps {
  task: any;
  getPriorityColor: (priority: string) => string;
  isDragging?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, getPriorityColor, isDragging }) => (
  <div
    className={`rounded-2xl border border-neutral-300 bg-white p-4 shadow-jira ${
      isDragging ? 'rotate-3 scale-105 shadow-2xl' : ''
    }`}
  >
    <h4 className="text-14 font-semibold text-neutral-1000">{task.title}</h4>
    {task.description && (
      <p className="mt-2 text-12 text-neutral-700 line-clamp-2">{task.description}</p>
    )}
    <div className="mt-3 flex items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`badge ${task.status === 'Done' ? 'badge-done' : task.status === 'In Progress' ? 'badge-progress' : 'badge-todo'}`}>
          {task.status}
        </span>
        {task.priority && (
          <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        )}
        {task.dueDate && (
          <span className="text-11 text-neutral-600 flex items-center gap-1">
            <Calendar size={10} />
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
      {task.assignee && (
        <div className="flex items-center gap-1" title={`Assigned to ${task.assignee.username}`}>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-jira-500 to-status-purple text-11 font-semibold text-white">
            {task.assignee.username.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </div>
  </div>
);

export default ProjectPage;
