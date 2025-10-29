import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { UserPlus, Mail, CheckCircle, ArrowLeft, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { register } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';

const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const inviteEmail = searchParams.get('email');
  const inviteToken = searchParams.get('inviteToken');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(inviteEmail || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { acceptInvitation } = useOrganization();

  const commitments = [
    'Keep projects, docs, and decisions in one connected space.',
    'Provide guardrails with granular roles and secure access.',
    'Help teams ship faster with clarity on priorities and owners.',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await register(username, email, password);
      toast.success('Account created successfully!');
      login(response.token, response.userId);

      if (inviteToken) {
        try {
          const organization = await acceptInvitation(inviteToken);
          toast.success(`Joined ${organization.name}!`);
          navigate(`/organizations/${organization._id}`);
          return;
        } catch (err) {
          console.error('Error accepting invitation:', err);
        }
      }

      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-neutral-100 text-neutral-1000 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-jira-600 via-jira-500 to-status-purple lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_55%)]" />
        <div className="relative flex w-full flex-col justify-between px-16 py-14 text-white">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-14 font-semibold text-white/80 hover:text-white">
              <ArrowLeft size={16} />
              Back to site
            </Link>
          </div>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-11 font-semibold uppercase tracking-[0.3em] text-white/70">
              Get started
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-snug">
              Launch a shared operating system for your team&apos;s work.
            </h1>
            <p className="mt-4 max-w-lg text-sm text-white/80">
              AISR combines planning, documentation, and collaboration so teams can move together with confidence.
            </p>
            <ul className="mt-8 space-y-4 text-sm text-white/85">
              {commitments.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle size={18} className="mt-0.5 text-status-green" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-sm text-white/80">
              <Shield size={20} className="text-white/90" />
              Enterprise-grade security with SSO, SCIM, and detailed audit logs.
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md space-y-10">
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-neutral-200 px-3 py-1 text-11 font-semibold uppercase tracking-wide text-neutral-700">
              Create account
            </div>
            <h2 className="text-29 font-semibold text-neutral-1000">Join AISR</h2>
            <p className="text-14 text-neutral-700">
              Set up your workspace credentials and start building momentum with your team.
            </p>
          </div>

          {inviteEmail && (
            <div className="flex items-start gap-3 rounded-2xl border border-jira-200 bg-jira-50/60 p-4">
              <Mail size={18} className="mt-0.5 text-jira-600" />
              <div className="text-left text-sm text-neutral-700">
                <p className="font-semibold text-jira-700">Invitation detected</p>
                <p className="text-xs text-neutral-600">
                  Continue with <strong>{inviteEmail}</strong> to accept your invite.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-neutral-300 bg-white p-8 shadow-soft">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="mb-2 block text-12 font-semibold uppercase tracking-wide text-neutral-700">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  required
                  minLength={3}
                  className="input-field"
                  placeholder="alex.w"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-12 font-semibold uppercase tracking-wide text-neutral-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={!!inviteEmail}
                  disabled={!!inviteEmail}
                />
                {inviteEmail && <p className="mt-1 text-11 font-semibold text-jira-600">Email is locked from invitation</p>}
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-12 font-semibold uppercase tracking-wide text-neutral-700">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  minLength={6}
                  className="input-field"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="mt-1 text-11 text-neutral-600">Must include at least 6 characters.</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex w-full items-center justify-center gap-2 text-14 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                <UserPlus size={18} />
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center text-14 text-neutral-700">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-jira-600 hover:text-jira-500">
                  Sign in
                </Link>
              </p>
              <Link to="/" className="inline-flex items-center justify-center gap-2 text-12 text-neutral-600 hover:text-neutral-900">
                <ArrowLeft size={14} />
                Back to marketing site
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
