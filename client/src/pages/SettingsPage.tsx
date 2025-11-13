import React, { useEffect, useMemo, useState } from 'react';
import {
  BellIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import { getCurrentUser, updateUserProfile } from '../services/api';
import type { User } from '../types/api';
import { getErrorMessage } from '../utils/errors';

type Preferences = {
  emailUpdates: boolean;
  mentionAlerts: boolean;
  taskReminders: boolean;
  weeklyDigest: boolean;
  productUpdates: boolean;
  celebrateMilestones: boolean;
  theme: 'system' | 'light' | 'dark';
};

type PreferenceKey = Exclude<keyof Preferences, 'theme'>;

const PREFERENCE_STORAGE_KEY = 'aisr:settings:preferences';

const defaultPreferences: Preferences = {
  emailUpdates: true,
  mentionAlerts: true,
  taskReminders: true,
  weeklyDigest: false,
  productUpdates: false,
  celebrateMilestones: true,
  theme: 'system',
};

const preferenceSections: Array<{
  key: PreferenceKey;
  label: string;
  description: string;
}> = [
  {
    key: 'emailUpdates',
    label: 'Project email updates',
    description: 'Get summaries when projects you follow have new activity.',
  },
  {
    key: 'mentionAlerts',
    label: 'Mentions & direct replies',
    description: 'Notify me immediately when teammates mention or reply to me.',
  },
  {
    key: 'taskReminders',
    label: 'Upcoming task reminders',
    description: 'Receive reminders for tasks due soon so nothing slips through.',
  },
  {
    key: 'weeklyDigest',
    label: 'Friday focus digest',
    description: 'A weekly roll-up of key updates to help plan the week ahead.',
  },
  {
    key: 'productUpdates',
    label: 'Product announcements',
    description: 'Occasional notes about new AISR capabilities and improvements.',
  },
  {
    key: 'celebrateMilestones',
    label: 'Celebrate shipped work',
    description: 'Show celebratory nudges when projects or epics move to done.',
  },
];

const loadPreferences = (): Preferences => {
  if (typeof window === 'undefined') {
    return defaultPreferences;
  }

  try {
    const stored = localStorage.getItem(PREFERENCE_STORAGE_KEY);
    if (!stored) {
      return defaultPreferences;
    }
    const parsed = JSON.parse(stored) as Partial<Preferences>;
    return { ...defaultPreferences, ...parsed };
  } catch (err) {
    console.warn('Unable to parse stored preferences', err);
    return defaultPreferences;
  }
};

type PreferenceToggleProps = {
  enabled: boolean;
  onChange: () => void;
  label: string;
};

const PreferenceToggle: React.FC<PreferenceToggleProps> = ({ enabled, onChange, label }) => (
  <button
    type="button"
    aria-pressed={enabled}
    onClick={onChange}
    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-150 ${
      enabled ? 'bg-jira-500' : 'bg-neutral-300'
    }`}
  >
    <span className="sr-only">{label}</span>
    <span
      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition duration-150 ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const SettingsPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    jobTitle: '',
    department: '',
    avatar: '',
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const current = await getCurrentUser();
        setUser(current);
        setProfileForm({
          username: current.username ?? '',
          email: current.email ?? '',
          jobTitle: current.jobTitle ?? '',
          department: current.department ?? '',
          avatar: current.avatar ?? '',
        });
      } catch (err) {
        console.error(err);
        toast.error(getErrorMessage(err, 'Failed to load your profile.'));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(PREFERENCE_STORAGE_KEY, JSON.stringify(preferences));
    } catch (err) {
      console.warn('Unable to persist preferences', err);
    }
  }, [preferences]);

  const initials = useMemo(() => {
    if (!profileForm.username) {
      return 'AA';
    }
    const pieces = profileForm.username.trim().split(' ').filter(Boolean);
    if (pieces.length === 0) {
      return 'AA';
    }
    if (pieces.length === 1) {
      return pieces[0].slice(0, 2).toUpperCase();
    }
    return (pieces[0][0] + pieces[pieces.length - 1][0]).toUpperCase();
  }, [profileForm.username]);

  const formattedJoinedDate = useMemo(() => {
    if (!user?.createdAt) {
      return '—';
    }
    try {
      return new Intl.DateTimeFormat('en', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(user.createdAt));
    } catch {
      return '—';
    }
  }, [user?.createdAt]);

  const handleProfileChange = (key: keyof typeof profileForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setProfileForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleProfileReset = () => {
    if (!user) {
      return;
    }
    setProfileForm({
      username: user.username ?? '',
      email: user.email ?? '',
      jobTitle: user.jobTitle ?? '',
      department: user.department ?? '',
      avatar: user.avatar ?? '',
    });
  };

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profileForm.username.trim()) {
      toast.error('Please add a name so teammates know who you are.');
      return;
    }

    setSavingProfile(true);
    try {
      const payload = {
        username: profileForm.username.trim(),
        jobTitle: profileForm.jobTitle.trim(),
        department: profileForm.department.trim(),
        avatar: profileForm.avatar.trim(),
      };
      const updated = await updateUserProfile(payload);
      setUser(updated);
      toast.success('Profile updated successfully.');
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, 'Unable to save profile changes.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePreferenceToggle = (key: PreferenceKey) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      toast.success('Preferences updated.');
      return next;
    });
  };

  const handleThemeChange = (value: Preferences['theme']) => {
    setPreferences((prev) => {
      if (prev.theme === value) {
        return prev;
      }
      toast.success(`Theme preference set to ${value}.`);
      return { ...prev, theme: value };
    });
  };

  if (loading) {
    return <LoadingState label="Loading settings..." />;
  }

  if (!user) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Settings"
          subtitle="Tune AISR to work the way you do."
        />
        <div className="rounded-2xl border border-neutral-300 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-neutral-900">We couldn&apos;t load your profile.</h2>
          <p className="mt-2 text-sm text-neutral-700">
            Try refreshing the page. If the problem persists, sign out and sign back in to refresh your session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        subtitle="Keep your profile up to date and fine-tune notifications so AISR stays helpful."
      />

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr] xl:grid-cols-[3fr,2fr]">
        <div className="space-y-6">
          <form
            className="space-y-6 rounded-2xl border border-neutral-300 bg-white p-6 shadow-soft"
            onSubmit={handleProfileSubmit}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-neutral-200 text-lg font-semibold text-neutral-800">
                  {profileForm.avatar ? (
                    <img
                      src={profileForm.avatar}
                      alt={`${profileForm.username} avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{profileForm.username || 'Your name'}</p>
                  <p className="text-sm text-neutral-600">{profileForm.email}</p>
                  {profileForm.avatar && (
                    <button
                      type="button"
                      className="btn-ghost mt-2 px-2 py-1 text-12"
                      onClick={() =>
                        setProfileForm((prev) => ({
                          ...prev,
                          avatar: '',
                        }))
                      }
                    >
                      Remove avatar
                    </button>
                  )}
                </div>
              </div>
              <div className="rounded-xl bg-jira-50 px-4 py-3 text-sm text-jira-700">
                <p className="font-medium">This is how teammates find you.</p>
                <p className="mt-1 text-12">
                  Update your details so assignees, approvals, and comments stay clear.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-sm font-medium text-neutral-800">Preferred name</span>
                <input
                  type="text"
                  className="input-field rounded-xl border-2 border-neutral-200 bg-neutral-100 focus:bg-white"
                  placeholder="Your display name"
                  value={profileForm.username}
                  onChange={handleProfileChange('username')}
                  maxLength={80}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-sm font-medium text-neutral-800">Email</span>
                <input
                  type="email"
                  className="input-field rounded-xl border-2 border-neutral-200 bg-neutral-100 text-neutral-700"
                  value={profileForm.email}
                  disabled
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-sm font-medium text-neutral-800">Role / title</span>
                <input
                  type="text"
                  className="input-field rounded-xl border-2 border-neutral-200 bg-neutral-100 focus:bg-white"
                  placeholder="e.g. Product Manager"
                  value={profileForm.jobTitle}
                  onChange={handleProfileChange('jobTitle')}
                  maxLength={80}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-sm font-medium text-neutral-800">Department</span>
                <input
                  type="text"
                  className="input-field rounded-xl border-2 border-neutral-200 bg-neutral-100 focus:bg-white"
                  placeholder="e.g. Product Operations"
                  value={profileForm.department}
                  onChange={handleProfileChange('department')}
                  maxLength={80}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                <span className="text-sm font-medium text-neutral-800">Avatar URL</span>
                <input
                  type="url"
                  className="input-field rounded-xl border-2 border-neutral-200 bg-neutral-100 focus:bg-white"
                  placeholder="Paste a link to a square image"
                  value={profileForm.avatar}
                  onChange={handleProfileChange('avatar')}
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 border-t border-dashed border-neutral-300 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-neutral-600">
                Your changes are visible to anyone who can see you in AISR.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-ghost px-3 py-1.5 text-sm"
                  onClick={handleProfileReset}
                  disabled={savingProfile}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-1.5 text-sm"
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-6 rounded-2xl border border-neutral-300 bg-white p-6 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-jira-50 p-3 text-jira-600">
                <BellIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Notifications</h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Choose the updates you care about so your inbox and sidebar stay focused.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {preferenceSections.map((preference) => (
                <div
                  key={preference.key}
                  className="flex items-start justify-between gap-4 rounded-xl border border-neutral-200 bg-neutral-100/40 px-4 py-3 transition hover:border-neutral-300 hover:bg-neutral-100"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{preference.label}</p>
                    <p className="mt-1 text-12 text-neutral-600">{preference.description}</p>
                  </div>
                  <PreferenceToggle
                    enabled={preferences[preference.key]}
                    onChange={() => handlePreferenceToggle(preference.key)}
                    label={`Toggle ${preference.label}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 rounded-2xl border border-neutral-300 bg-white p-6 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-jira-50 p-3 text-jira-600">
                <WrenchScrewdriverIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Workspace preferences</h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Make AISR feel familiar by choosing a theme and focusing your home surface.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-100/60 p-4">
                <span className="text-sm font-medium text-neutral-800">Theme</span>
                <select
                  className="input-field rounded-xl border-2 border-neutral-200 bg-white"
                  value={preferences.theme}
                  onChange={(event) => handleThemeChange(event.target.value as Preferences['theme'])}
                >
                  <option value="system">Match system</option>
                  <option value="light">Always light</option>
                  <option value="dark">Lights out</option>
                </select>
                <p className="text-12 text-neutral-600">
                  We&apos;ll remember your choice on this device.
                </p>
              </label>
              <div className="flex flex-col justify-between gap-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-100/60 p-4">
                <div>
                  <span className="text-sm font-medium text-neutral-800">Focus tips</span>
                  <p className="mt-1 text-12 text-neutral-600">
                    Try starring your most important projects from the sidebar for quick access.
                  </p>
                </div>
                <a
                  href="https://www.atlassian.com/software/jira/guides"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-fit px-3 py-1.5 text-sm"
                >
                  Explore best practices
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-300 bg-white p-6 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-jira-50 p-3 text-jira-600">
                <ShieldCheckIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Account health</h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Everything looks secure. Keep an eye on your session and update your password regularly.
                </p>
              </div>
            </div>

            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-4">
                <dt className="font-medium text-neutral-800">Role</dt>
                <dd className="text-neutral-700 capitalize">{user.role}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-4">
                <dt className="font-medium text-neutral-800">Member since</dt>
                <dd className="text-neutral-700">{formattedJoinedDate}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-4">
                <dt className="font-medium text-neutral-800">User ID</dt>
                <dd className="truncate text-neutral-600">{user.id}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="font-medium text-neutral-800">Celebrations</dt>
                <dd className="inline-flex items-center gap-2 rounded-full bg-green-50 px-2.5 py-1 text-11 font-semibold uppercase tracking-wide text-status-green">
                  <CheckCircleIcon className="h-4 w-4" />
                  Enabled
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-neutral-300 bg-white p-6 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-jira-50 p-3 text-jira-600">
                <UserCircleIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Need a hand?</h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Visit our help center or reach out to the AISR team to get unstuck fast.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4 text-sm">
              <a
                href="mailto:support@aisr.app"
                className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 transition hover:border-jira-400 hover:bg-jira-50"
              >
                <span className="font-medium text-neutral-900">Email support</span>
                <span className="text-12 text-jira-600">support@aisr.app</span>
              </a>
              <a
                href="https://community.atlassian.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 transition hover:border-jira-400 hover:bg-jira-50"
              >
                <span className="font-medium text-neutral-900">Community forums</span>
                <span className="text-12 text-jira-600">Open in new tab</span>
              </a>
              <a
                href="https://status.atlassian.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 transition hover:border-jira-400 hover:bg-jira-50"
              >
                <span className="font-medium text-neutral-900">Service status</span>
                <span className="text-12 text-jira-600">Check uptime</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
