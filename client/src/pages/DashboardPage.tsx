import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, FileText, Plus, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { getProjects, getDocuments, getTasksForProject } from '../services/api';

const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
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

        // Fetch tasks from first project if available
        if (projectsData.length > 0) {
          const tasks = await getTasksForProject(projectsData[0]._id);
          setRecentTasks(tasks.slice(0, 5));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your workspace.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FolderKanban className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Documents</p>
              <p className="text-3xl font-bold text-gray-900">{documents.length}</p>
            </div>
            <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
              <FileText className="text-secondary-600" size={24} />
            </div>
          </div>
        </div>



        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{recentTasks.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/projects/new" className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Plus className="text-primary-600" size={20} />
            </div>
            <div>
              <p className="font-medium text-gray-900">New Project</p>
              <p className="text-sm text-gray-600">Create a new project</p>
            </div>
          </Link>

          <Link to="/documents" className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-secondary-500 hover:bg-secondary-50 transition-all">
            <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
              <Plus className="text-secondary-600" size={20} />
            </div>
            <div>
              <p className="font-medium text-gray-900">New Document</p>
              <p className="text-sm text-gray-600">Start writing</p>
            </div>
          </Link>


        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
            <Link to="/projects" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {projects.slice(0, 5).map((project) => (
              <Link
                key={project._id}
                to={`/projects/${project._id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FolderKanban className="text-primary-600" size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{project.name}</p>
                  <p className="text-sm text-gray-600 truncate">{project.description}</p>
                </div>
              </Link>
            ))}
            {projects.length === 0 && (
              <p className="text-gray-500 text-center py-8">No projects yet. Create your first one!</p>
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Tasks</h2>
          </div>
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div key={task._id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="mt-1">
                  {task.status === 'Done' ? (
                    <CheckCircle2 className="text-green-600" size={20} />
                  ) : (
                    <Clock className="text-orange-600" size={20} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{task.title}</p>
                  <p className="text-sm text-gray-600">{task.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`badge ${task.status === 'Done' ? 'badge-done' : task.status === 'In Progress' ? 'badge-progress' : 'badge-todo'}`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {recentTasks.length === 0 && (
              <p className="text-gray-500 text-center py-8">No tasks yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
