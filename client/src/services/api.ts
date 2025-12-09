import axios from 'axios';

const API_URL = 'http://localhost:5001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 errors (invalid/expired tokens)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const register = async (payload: {
  username: string;
  email: string;
  password: string;
  organization?: {
    name: string;
    description?: string;
    allowMemberInvite?: boolean;
    requireApproval?: boolean;
  };
}) => {
  const res = await api.post('/auth/register', payload);
  return res.data;
};

// Projects
export const getProjects = async () => {
  const res = await api.get('/projects');
  return res.data;
};

export const getProject = async (id: string) => {
  const res = await api.get(`/projects/${id}`);
  return res.data;
};

export const createProject = async (project: { name: string, description: string }) => {
  const res = await api.post('/projects', project);
  return res.data;
};

export const getOrganization = async (id: string) => {
  const res = await api.get(`/organizations/${id}`);
  return res.data;
};

// Tasks
export const getMyTasks = async () => {
  const res = await api.get('/users/my-tasks');
  return res.data;
};

export const getTasksForProject = async (projectId: string) => {
  const res = await api.get(`/tasks/project/${projectId}`);
  return res.data;
};

export const createTask = async (task: { 
  title: string, 
  description: string, 
  project: string,
  assignee?: string,
  priority?: string,
  status?: string,
  dueDate?: Date
}) => {
  const res = await api.post('/tasks', task);
  return res.data;
};

export const updateTask = async (id: string, task: { title?: string, description?: string, status?: string, priority?: string }) => {
  const res = await api.patch(`/tasks/${id}`, task);
  return res.data;
};

export const deleteTask = async (id: string) => {
  const res = await api.delete(`/tasks/${id}`);
  return res.data;
};

export const generateTasks = async (data: {
  description: string,
  projectId: string
}) => {
  const res = await api.post('/tasks/generate', data);
  return res.data;
};

// Documents
export const getDocuments = async () => {
  const res = await api.get('/documents');
  return res.data;
};

export const getDocument = async (id: string) => {
  const res = await api.get(`/documents/${id}`);
  return res.data;
};

export const createDocument = async (document: {
  title: string;
  content?: string;
  project?: string;
  docType?: string;
  tags?: string[];
  summary?: string;
}) => {
  const res = await api.post('/documents', document);
  return res.data;
};

export const updateDocument = async (id: string, document: {
  title?: string;
  content?: string;
  docType?: string;
  tags?: string[];
  summary?: string;
}) => {
  const res = await api.patch(`/documents/${id}`, document);
  return res.data;
};

export const deleteDocument = async (id: string) => {
  const res = await api.delete(`/documents/${id}`);
  return res.data;
};



// Comments
export const getCommentsForTask = async (taskId: string) => {
  const res = await api.get(`/comments/task/${taskId}`);
  return res.data;
};

export const createComment = async (comment: { content: string, task: string }) => {
  const res = await api.post('/comments', comment);
  return res.data;
};

export const updateComment = async (id: string, content: string) => {
  const res = await api.patch(`/comments/${id}`, { content });
  return res.data;
};

export const deleteComment = async (id: string) => {
  const res = await api.delete(`/comments/${id}`);
  return res.data;
};

// Users
export const getUsers = async () => {
  const res = await api.get('/users');
  return res.data;
};

export const getCurrentUser = async () => {
  const res = await api.get('/users/me');
  return res.data;
};

export const updateUserProfile = async (data: any) => {
  const res = await api.patch('/users/me', data);
  return res.data;
};

export const updateUserRole = async (userId: string, role: string) => {
  const res = await api.patch(`/users/${userId}/role`, { role });
  return res.data;
};
