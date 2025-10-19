import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FolderPlus, Building2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { createProject } from '../services/api';
import { useOrganization } from '../context/OrganizationContext';

const NewProjectPage: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [organization, setOrganization] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { organizations, fetchOrganizations } = useOrganization();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const selectedOrg = organizations.find(org => org._id === organization);
  const availableMembers = selectedOrg?.members || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const projectData: any = { name, description };
      if (organization) {
        projectData.organization = organization;
      }
      if (selectedMembers.length > 0) {
        projectData.members = selectedMembers;
      }
      const project = await createProject(projectData);
      toast.success('Project created successfully!');
      navigate(`/projects/${project._id}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/projects')}
          className="btn-ghost flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-600 mt-1">Start a new project to organize your tasks</p>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              required
              className="input-field"
              placeholder="e.g., Website Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={5}
              className="input-field"
              placeholder="Describe your project goals and objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Organization Selector */}
          <div>
            <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Building2 size={16} />
              Organization (Optional)
            </label>
            <select
              id="organization"
              className="input-field"
              value={organization}
              onChange={(e) => {
                setOrganization(e.target.value);
                setSelectedMembers([]); // Reset members when org changes
              }}
            >
              <option value="">No Organization (Personal Project)</option>
              {organizations.map((org) => (
                <option key={org._id} value={org._id}>
                  {org.name} ({org.members.length} members)
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Link this project to an organization to collaborate with team members
            </p>
          </div>

          {/* Member Selector */}
          {organization && availableMembers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Users size={16} />
                Team Members (Optional)
              </label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                {availableMembers.map((member) => (
                  <label
                    key={member.user._id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.user._id)}
                      onChange={() => toggleMember(member.user._id)}
                      className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {member.user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{member.user.username}</div>
                        <div className="text-xs text-gray-500">{member.user.email}</div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 capitalize">{member.role}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <FolderPlus size={20} />
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectPage;
