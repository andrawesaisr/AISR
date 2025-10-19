import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Presentation, Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getBoards, createBoard, deleteBoard, getProjects } from '../services/api';
import { useOrganization } from '../context/OrganizationContext';

const BoardsPage: React.FC = () => {
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const { organizations } = useOrganization();

  useEffect(() => {
    fetchBoards();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const fetchBoards = async () => {
    try {
      const data = await getBoards();
      setBoards(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newBoard = await createBoard({ 
        name: newBoardName, 
        description: newBoardDesc,
        project: selectedProject || undefined
      });
      setBoards([newBoard, ...boards]);
      setShowCreateModal(false);
      setNewBoardName('');
      setNewBoardDesc('');
      setSelectedProject('');
      toast.success('Board created!');
    } catch (err) {
      toast.error('Failed to create board');
    }
  };

  const handleDeleteBoard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this board?')) return;
    try {
      await deleteBoard(id);
      setBoards(boards.filter(board => board._id !== id));
      toast.success('Board deleted');
    } catch (err) {
      toast.error('Failed to delete board');
    }
  };

  const filteredBoards = boards.filter(board =>
    board.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Boards</h1>
          <p className="text-gray-600">Visual whiteboards for brainstorming and collaboration</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          New Board
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search boards..."
          className="input-field pl-12"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Boards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBoards.map((board) => (
          <div key={board._id} className="card group relative">
            <Link to={`/boards/${board._id}`} className="block">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Presentation className="text-green-600" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1 truncate">{board.name}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(board.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">
                {board.description || 'No description'}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {board.elements?.length || 0} elements
                </span>
              </div>
            </Link>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteBoard(board._id);
                }}
                className="p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-600 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredBoards.length === 0 && (
        <div className="text-center py-16">
          <Presentation className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No boards found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'Try a different search term' : 'Create your first board to get started'}
          </p>
          {!searchQuery && (
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              <Plus size={20} className="inline mr-2" />
              Create Board
            </button>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Create New Board</h2>
            </div>
            <form onSubmit={handleCreateBoard} className="p-6">
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Board Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="input-field"
                  placeholder="Enter board name..."
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  className="input-field"
                  placeholder="Enter board description..."
                  rows={3}
                  value={newBoardDesc}
                  onChange={(e) => setNewBoardDesc(e.target.value)}
                />
              </div>
              <div className="mb-6">
                <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-2">
                  Project (optional)
                </label>
                <select
                  id="project"
                  className="input-field"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  <option value="">No project (personal board)</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                      {project.organization && ` (${project.organization.name})`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a project to share this board with your team
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardsPage;
