import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useOrganization } from '../context/OrganizationContext';
import { useAuth } from '../context/AuthContext';
import { BuildingOffice2Icon as Building2, EnvelopeIcon as Mail, CheckCircleIcon as CheckCircle, XCircleIcon as XCircle, ClockIcon as Clock, LockClosedIcon as Lock } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingState from '../components/LoadingState';

const API_URL =  'http://localhost:5001';

const InvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { getInvitationDetails, acceptInvitation } = useOrganization();
  const { token: authToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loginError, setLoginError] = useState('');
  const [userExists, setUserExists] = useState<boolean | null>(null);

  useEffect(() => {
    if (token) {
      loadInvitationDetails();
    }
    if (authToken) {
      loadCurrentUser();
    }
  }, [token, authToken]);

  const loadCurrentUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setCurrentUser(response.data);
    } catch (err) {
      console.error('Error loading user:', err);
    }
  };

  const loadInvitationDetails = async () => {
    try {
      const details = await getInvitationDetails(token!);
      setInviteDetails(details);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired invitation');
    } finally {
      setLoading(false);
    }
  };

  const checkUserExists = async () => {
    try {
      // Try to check if user exists by attempting login with a dummy password
      // Or we can add a dedicated endpoint, but for now we'll check on form show
      setShowLoginForm(true);
      // We'll determine if user exists when they try to submit
      setUserExists(null);
    } catch (err) {
      setUserExists(false);
    }
  };

  const handleLoginOrRegisterAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setAccepting(true);

    try {
      let userAuthToken: string;
      let userId: string;

      // Try to login first
      try {
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          email: inviteDetails.email,
          password: password,
        });
        userAuthToken = loginResponse.data.token;
        userId = loginResponse.data.userId;
        setUserExists(true);
      } catch (loginErr: any) {
        // If login fails with 401, user doesn't exist - create account
        if (loginErr.response?.status === 401 || loginErr.response?.status === 400) {
          if (!username) {
            setLoginError('Please enter a username to create your account');
            setAccepting(false);
            setUserExists(false);
            return;
          }

          // Register new user
          const registerResponse = await axios.post(`${API_URL}/auth/register`, {
            username: username,
            email: inviteDetails.email,
            password: password,
          });
          userAuthToken = registerResponse.data.token;
          userId = registerResponse.data.userId;
          toast.success('Account created!');
        } else {
          throw loginErr;
        }
      }

      // Store auth token
      localStorage.setItem('token', userAuthToken);
      localStorage.setItem('userId', userId);

      // Accept invitation using the invitation token from URL
      const acceptResponse = await axios.post(
        `${API_URL}/organizations/invite/${token}/accept`,
        {},
        { headers: { Authorization: `Bearer ${userAuthToken}` } }
      );

      toast.success('Successfully joined organization!');
      setSuccess(true);
      
      setTimeout(() => {
        navigate(`/organizations/${acceptResponse.data.organization._id}`);
        window.location.reload(); // Reload to update auth context
      }, 1500);
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setLoginError(err.response?.data?.message || 'Failed to process request');
      setAccepting(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!authToken) {
      setShowLoginForm(true);
      return;
    }

    setAccepting(true);
    try {
      const organization = await acceptInvitation(token!);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/organizations/${organization.id}`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return <LoadingState label="Validating invitation..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Aboard!</h1>
          <p className="text-gray-600 mb-4">
            You've successfully joined <strong>{inviteDetails.organizationName}</strong>
          </p>
          <p className="text-sm text-gray-500">Redirecting to organization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Invited!</h1>
          <p className="text-gray-600">
            You've been invited to join an organization
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Organization</span>
              <p className="text-lg font-semibold text-gray-900">{inviteDetails.organizationName}</p>
            </div>
            {inviteDetails.organizationDescription && (
              <div>
                <span className="text-sm text-gray-500">Description</span>
                <p className="text-gray-700">{inviteDetails.organizationDescription}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-gray-500">Your Role</span>
              <p className="text-gray-900 font-medium capitalize">{inviteDetails.role}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Invited Email</span>
              <p className="text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {inviteDetails.email}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Expires</span>
              <p className="text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {new Date(inviteDetails.expiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {!authToken ? (
          <div className="space-y-4">
            {!showLoginForm ? (
              <>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Please log in or create an account to accept this invitation
                </p>
                <button
                  onClick={handleAcceptInvitation}
                  className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition font-medium flex items-center justify-center gap-2"
                >
                  <Lock className="w-5 h-5" />
                  Log In to Accept
                </button>
                <button
                  onClick={() => navigate(`/register?email=${encodeURIComponent(inviteDetails.email)}&inviteToken=${token}`)}
                  className="w-full border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition"
                >
                  Create Account
                </button>
              </>
            ) : (
              <form onSubmit={handleLoginOrRegisterAndAccept} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-900 font-medium">
                    {userExists === false 
                      ? `Create your account for ${inviteDetails.email}`
                      : `Enter your password for ${inviteDetails.email}`
                    }
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {userExists === false 
                      ? "We'll create your account automatically"
                      : "Already have an account? Just enter your password"
                    }
                  </p>
                </div>
                
                {userExists === false && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Choose a username"
                      minLength={3}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus={userExists !== false}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={userExists === false ? "Create a password (min 6 characters)" : "Enter your password"}
                    minLength={6}
                  />
                  {loginError && (
                    <p className="text-red-500 text-sm mt-2">{loginError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={accepting}
                  className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {accepting 
                    ? (userExists === false ? 'Creating account...' : 'Logging in...') 
                    : (userExists === false ? 'Create Account & Accept' : 'Log In & Accept')
                  }
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowLoginForm(false);
                    setPassword('');
                    setLoginError('');
                  }}
                  className="w-full text-gray-600 hover:text-gray-900 text-sm"
                >
                  ← Back
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Don't have an account?</p>
                  <button
                    type="button"
                    onClick={() => navigate(`/register?email=${encodeURIComponent(inviteDetails.email)}&inviteToken=${token}`)}
                    className="text-blue-500 hover:text-blue-600 font-medium text-sm"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : currentUser?.email.toLowerCase() !== inviteDetails.email.toLowerCase() ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              ⚠️ This invitation was sent to <strong>{inviteDetails.email}</strong>, but you're logged in as <strong>{currentUser?.email}</strong>.
              Please log in with the correct account.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-3 w-full bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
            >
              Switch Account
            </button>
          </div>
        ) : (
          <button
            onClick={handleAcceptInvitation}
            disabled={accepting}
            className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {accepting ? 'Accepting...' : 'Accept Invitation'}
          </button>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full mt-3 text-gray-600 hover:text-gray-800 transition"
        >
          Decline
        </button>
      </div>
    </div>
  );
};

export default InvitePage;
