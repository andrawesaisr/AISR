import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API_URL =   'http://localhost:5001';

interface OrganizationMember {
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    jobTitle?: string;
  };
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: 'admin' | 'member';
  invitedBy: {
    id: string;
    username: string;
  };
  token: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
}

interface Organization {
  id: string;
  name: string;
  description?: string;
  members: OrganizationMember[];
  invitations: Invitation[];
  createdBy: string;
  settings?: {
    allowMemberInvite: boolean;
    requireApproval: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface OrganizationContextType {
  organizations: Organization[];
  currentOrganization: Organization | null;
  loading: boolean;
  error: string | null;
  fetchOrganizations: () => Promise<void>;
  fetchOrganization: (id: string) => Promise<void>;
  createOrganization: (data: { name: string; description?: string }) => Promise<Organization>;
  updateOrganization: (id: string, data: Partial<Organization>) => Promise<Organization>;
  deleteOrganization: (id: string) => Promise<void>;
  inviteMember: (organizationId: string, email: string, role: 'admin' | 'member') => Promise<{ message: string; inviteLink?: string }>;
  removeMember: (organizationId: string, userId: string) => Promise<void>;
  updateMemberRole: (organizationId: string, userId: string, role: 'admin' | 'member') => Promise<void>;
  cancelInvitation: (organizationId: string, invitationId: string) => Promise<void>;
  acceptInvitation: (token: string) => Promise<Organization>;
  getInvitationDetails: (token: string) => Promise<any>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
};

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchOrganizations = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/organizations`, getAuthHeaders());
      setOrganizations(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch organizations');
      console.error('Error fetching organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganization = async (id: string) => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/organizations/${id}`, getAuthHeaders());
      setCurrentOrganization(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch organization');
      console.error('Error fetching organization:', err);
    } finally {
      setLoading(false);
    }
  };

  const createOrganization = async (data: { name: string; description?: string }) => {
    const response = await axios.post(`${API_URL}/organizations`, data, getAuthHeaders());
    setOrganizations([...organizations, response.data]);
    return response.data;
  };

  const updateOrganization = async (id: string, data: Partial<Organization>) => {
    const response = await axios.patch(`${API_URL}/organizations/${id}`, data, getAuthHeaders());
    setOrganizations(organizations.map(org => org.id === id ? response.data : org));
    if (currentOrganization?.id === id) {
      setCurrentOrganization(response.data);
    }
    return response.data;
  };

  const deleteOrganization = async (id: string) => {
    await axios.delete(`${API_URL}/organizations/${id}`, getAuthHeaders());
    setOrganizations(organizations.filter(org => org.id !== id));
    if (currentOrganization?.id === id) {
      setCurrentOrganization(null);
    }
  };

  const inviteMember = async (organizationId: string, email: string, role: 'admin' | 'member') => {
    const response = await axios.post(
      `${API_URL}/organizations/${organizationId}/invite`,
      { email, role },
      getAuthHeaders()
    );
    await fetchOrganization(organizationId);
    return response.data;
  };

  const removeMember = async (organizationId: string, userId: string) => {
    await axios.delete(
      `${API_URL}/organizations/${organizationId}/members/${userId}`,
      getAuthHeaders()
    );
    await fetchOrganization(organizationId);
  };

  const updateMemberRole = async (organizationId: string, userId: string, role: 'admin' | 'member') => {
    await axios.patch(
      `${API_URL}/organizations/${organizationId}/members/${userId}/role`,
      { role },
      getAuthHeaders()
    );
    await fetchOrganization(organizationId);
  };

  const cancelInvitation = async (organizationId: string, invitationId: string) => {
    await axios.delete(
      `${API_URL}/organizations/${organizationId}/invitations/${invitationId}`,
      getAuthHeaders()
    );
    await fetchOrganization(organizationId);
  };

  const acceptInvitation = async (token: string) => {
    const response = await axios.post(
      `${API_URL}/organizations/invite/${token}/accept`,
      {}
    );
    return response.data.organization;
  };

  const getInvitationDetails = async (token: string) => {
    const response = await axios.get(`${API_URL}/organizations/invite/${token}`);
    return response.data;
  };

  useEffect(() => {
    if (token) {
      fetchOrganizations();
    }
  }, [token]);

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        loading,
        error,
        fetchOrganizations,
        fetchOrganization,
        createOrganization,
        updateOrganization,
        deleteOrganization,
        inviteMember,
        removeMember,
        updateMemberRole,
        cancelInvitation,
        acceptInvitation,
        getInvitationDetails,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};
