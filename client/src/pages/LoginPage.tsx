import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRightOnRectangleIcon as LogIn, CheckCircleIcon as CheckCircle, ArrowLeftIcon as ArrowLeft } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const benefits = [
    'Plan projects with clarity and context in a single workspace.',
    'Keep conversations close to tasks and documents.',
    'Stay in sync with real-time updates and smart automations.',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, userId } = await login(email, password);
      authLogin(token, userId);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
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
              <ArrowLeft className="w-4 h-4" />
              Back to site
            </Link>
          </div>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-11 font-semibold uppercase tracking-[0.3em] text-white/70">
              AISR
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-snug">
              Work where projects, people, and documents stay in lockstep.
            </h1>
            <p className="mt-4 max-w-lg text-sm text-white/80">
              The AISR workspace gives every team a shared place to align planning with knowledge. Connect roadmaps, notes, and execution without the tab chaos.
            </p>
            <ul className="mt-8 space-y-4 text-sm text-white/85">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <CheckCircle className="w-[18px] h-[18px] mt-0.5 text-status-green" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
            <p className="text-sm font-medium text-white/80">“AISR gives our teams a single source of truth. Shipping has never felt this organized.”</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-white/60">Product Operations • Meridian Labs</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md space-y-10">
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-neutral-200 px-3 py-1 text-11 font-semibold uppercase tracking-wide text-neutral-700">
              Workspace access
            </div>
            <h2 className="text-29 font-semibold text-neutral-1000">Sign in to AISR</h2>
            <p className="text-14 text-neutral-700">
              Enter your credentials to sync up with your teams and projects.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-300 bg-white p-8 shadow-soft">
            <form onSubmit={handleSubmit} className="space-y-5">
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
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-12 font-semibold uppercase tracking-wide text-neutral-700">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex w-full items-center justify-center gap-2 text-14 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogIn className="w-[18px] h-[18px]" />
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center text-14 text-neutral-700">
              <p>
                Need an account?{' '}
                <Link to="/register" className="font-semibold text-jira-600 hover:text-jira-500">
                  Create one now
                </Link>
              </p>
              <Link to="/" className="inline-flex items-center justify-center gap-2 text-12 text-neutral-600 hover:text-neutral-900">
                <ArrowLeft className="w-[14px] h-[14px]" />
                Back to marketing site
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
