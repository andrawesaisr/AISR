import React, { useState, useEffect } from 'react';
import { createTask, getUsers } from '../../services/api';

interface NewTaskFormProps {
  projectId: string;
  onTaskCreated: (task: any) => void;
}

const NewTaskForm: React.FC<NewTaskFormProps> = ({ projectId, onTaskCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userData = await getUsers();
        setUsers(userData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTask = await createTask({ title, description, project: projectId, assignee });
      onTaskCreated(newTask);
      setTitle('');
      setDescription('');
      setAssignee('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create New Task</h3>
      <div className="mb-3">
        <label htmlFor="title" className="form-label">Title</label>
        <input
          type="text"
          className="form-control"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="description" className="form-label">Description</label>
        <textarea
          className="form-control"
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>
      </div>
      <div className="mb-3">
        <label htmlFor="assignee" className="form-label">Assignee</label>
        <select
          className="form-control"
          id="assignee"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
        >
          <option value="">Unassigned</option>
          {users.map(user => (
            <option key={user._id} value={user._id}>{user.username}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-primary">Create Task</button>
    </form>
  );
};

export default NewTaskForm;
