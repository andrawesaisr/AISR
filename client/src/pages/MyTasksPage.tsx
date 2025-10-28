
import React, { useEffect, useState } from 'react';
import { getMyTasks } from '../services/api';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-24 font-semibold text-neutral-1000">My Tasks</h1>
      <div className="card">
        <div className="divide-y divide-gray-200">
          {tasks.map((task) => (
            <div key={task._id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{task.project.name}</p>
                  {task.dueDate && (
                    <p className="text-sm text-gray-500">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              You have no assigned tasks.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTasksPage;
