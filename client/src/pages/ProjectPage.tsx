import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, LayoutGrid, List, Calendar, MessageSquare, Trash2, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getProject, getTasksForProject, createTask, updateTask, deleteTask, getCommentsForTask, createComment, getUsers } from '../services/api';

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
          setProject(res);
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-16">Project not found</div>;
  }

  const columns = {
    'To Do': tasks.filter(task => task.status === 'To Do'),
    'In Progress': tasks.filter(task => task.status === 'In Progress'),
    'Done': tasks.filter(task => task.status === 'Done'),
  };

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
    <div className="space-y-6">
      {/* Header - Jira Style */}
      <div className="bg-white border-b border-neutral-300 -mx-8 -mt-8 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/projects')} className="btn-ghost flex items-center gap-1">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-24 font-semibold text-neutral-1000">{project.name}</h1>
              <p className="text-12 text-neutral-700 mt-0.5">{project.description}</p>
            </div>
          </div>
          <button onClick={() => setShowTaskModal(true)} className="btn-primary gap-1">
            <Plus size={16} />
            Create
          </button>
        </div>
      </div>

      {/* View Toggle - Jira Style */}
      <div className="flex gap-1 mt-4">
        <button
          onClick={() => setView('board')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-jira font-medium transition-colors text-14 ${
            view === 'board' ? 'bg-neutral-200 text-neutral-1000' : 'text-neutral-800 hover:bg-neutral-100'
          }`}
        >
          <LayoutGrid size={16} />
          Board
        </button>
        <button
          onClick={() => setView('list')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-jira font-medium transition-colors text-14 ${
            view === 'list' ? 'bg-neutral-200 text-neutral-1000' : 'text-neutral-800 hover:bg-neutral-100'
          }`}
        >
          <List size={16} />
          List
        </button>
      </div>

      {/* Board View */}
      {view === 'board' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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
        <div className="card">
          <div className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <div
                key={task._id}
                onClick={() => openTaskDetail(task)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${task.status === 'Done' ? 'badge-done' : task.status === 'In Progress' ? 'badge-progress' : 'badge-todo'}`}>
                        {task.status}
                      </span>
                      {task.priority && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                No tasks yet. Create your first task to get started!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Create New Task</h2>
            </div>
            <form onSubmit={handleCreateTask} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Task title..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    className="input-field"
                    rows={4}
                    placeholder="Task description..."
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                  <select
                    className="input-field"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    className="input-field"
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
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Task
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
            <div className="p-6 border-b border-gray-200 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTask.title}</h2>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTask.status}
                    onChange={(e) => handleUpdateTask(selectedTask._id, { status: e.target.value })}
                    className="text-sm px-3 py-1 border border-gray-300 rounded-lg"
                  >
                    <option>To Do</option>
                    <option>In Progress</option>
                    <option>Done</option>
                  </select>
                  <select
                    value={selectedTask.priority || 'Medium'}
                    onChange={(e) => handleUpdateTask(selectedTask._id, { priority: e.target.value })}
                    className="text-sm px-3 py-1 border border-gray-300 rounded-lg"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => handleDeleteTask(selectedTask._id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{selectedTask.description || 'No description'}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageSquare size={18} />
                  Comments ({comments.length})
                </h3>
                <form onSubmit={handleAddComment} className="mb-4">
                  <textarea
                    className="input-field"
                    rows={2}
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button type="submit" className="btn-primary mt-2">
                    Add Comment
                  </button>
                </form>
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment._id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">
                          {comment.author?.username || 'User'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  ))}
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
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="bg-neutral-100 rounded-jira p-2"
    >
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="font-semibold text-neutral-800 text-12 uppercase tracking-wide">{title}</h3>
        <span className="text-11 text-neutral-700">{count}</span>
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
      className="task-card group relative"
    >
      <div className="flex items-start gap-1">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600 transition-colors opacity-0 group-hover:opacity-100"
        >
          <GripVertical size={14} />
        </button>
        <div className="flex-1" onClick={onClick}>
          <h4 className="font-normal text-neutral-1000 text-14 mb-1 leading-tight">{task.title}</h4>
          {task.description && (
            <p className="text-12 text-neutral-700 mb-2 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            {task.priority && (
              <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            )}
            {task.dueDate && (
              <span className="text-11 text-neutral-600 flex items-center gap-0.5">
                <Calendar size={10} />
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        {task.assignee && (
          <div className="flex items-center gap-1" title={`Assigned to ${task.assignee.username}`}>
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
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

const TaskCard: React.FC<TaskCardProps> = ({ task, getPriorityColor, isDragging }) => {
  return (
    <div className={`task-card ${isDragging ? 'shadow-2xl rotate-3 scale-105' : ''}`}>
      <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {task.priority && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          )}
          {task.dueDate && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar size={12} />
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
        {task.assignee && (
          <div className="flex items-center gap-1" title={`Assigned to ${task.assignee.username}`}>
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
              {task.assignee.username.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectPage;
