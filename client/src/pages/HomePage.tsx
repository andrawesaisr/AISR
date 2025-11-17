import React from 'react';
import { Link } from 'react-router-dom';
import {
  FolderIcon,
  DocumentTextIcon,
  PresentationChartLineIcon,
  BoltIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  SunIcon as Sun,
  MoonIcon as Moon,
  ComputerDesktopIcon as Monitor,
  FlagIcon as TargetIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';

const HomePage: React.FC = () => {
  const features = [
    {
      icon: FolderIcon,
      title: 'Modern project hub',
      description: 'Plan sprints, track blockers, and keep work visible across teams.',
    },
    {
      icon: DocumentTextIcon,
      title: 'Living documentation',
      description: 'Capture notes, specs, and decisions so context is always one click away.',
    },
    {
      icon: PresentationChartLineIcon,
      title: 'Aligned roadmaps',
      description: 'Connect strategy to delivery with timelines and progress summaries.',
    },
  ];

  const highlights = [
    { label: 'Teams onboarded', value: '150+' },
    { label: 'Docs created monthly', value: '12k' },
    { label: 'Avg. time saved per sprint', value: '18 hrs' },
  ];

  const pillars = [
    {
      icon: BoltIcon,
      title: 'Fast by design',
      description: 'Snappy boards, instant search, and zero friction workflows keep teams moving.',
    },
    {
      icon: UserGroupIcon,
      title: 'Built for collaboration',
      description: 'Share context, leave updates, and co-create documents without losing focus.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Enterprise-grade security',
      description: 'Granular roles, SSO, and audit trails ensure every data point stays protected.',
    },
  ];
  const { theme, resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    const ThemeGlyph = theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun;
const quickToggleLabel =
    nextTheme === 'dark' ? 'Switch to dark mode' : 'Switch to light mode';
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-1000 transition-colors duration-200 dark:bg-neutral-1000 dark:text-neutral-0">
      <header className="sticky top-0 z-40 border-b border-neutral-300 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-jira-500 to-status-purple text-white font-semibold shadow-soft dark:shadow-none">
              A
            </div>
            <span className="text-20 font-semibold tracking-tight text-neutral-900 dark:text-neutral-0">
              AISR
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-14 dark:text-neutral-200">
              Log in
            </Link>
            <Link to="/register" className="btn-primary px-4 text-14">
              Get started
            </Link>
          </nav>
         <button
          type="button"
          className={`sidebar-link  `}
          onClick={() => setTheme(nextTheme)}
          title={quickToggleLabel}
        >
          <span className={`flex items-center gap-2 `}>
            <ThemeGlyph className="w-4 h-4" />
            <span className={'text-14'}>Theme</span>
          </span>
          </button>
        </div>
      </header>

      <main className="space-y-24 pb-24">
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#3b82f6_0%,transparent_55%)] dark:bg-[radial-gradient(circle_at_top_left,#1e3a8a_0%,transparent_60%)]">
          <div className="absolute inset-0 bg-gradient-to-br from-jira-600 via-jira-500 to-status-purple opacity-95 dark:opacity-100" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(30,64,175,0.3),transparent_60%)]" />
          <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-10 px-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-12 font-semibold uppercase tracking-[0.3em] text-white/70">
              <SparklesIcon className="h-3.5 w-3.5" />
              Workspace OS
            </span>
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl md:leading-tight">
              Align strategy, execution, and knowledge in one shared flow.
            </h1>
            <p className="max-w-2xl text-lg text-white/80 md:text-xl">
              AISR brings the best of Jira and Notion together so teams can orchestrate projects and capture context without switching tools.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary min-w-[180px] justify-center text-14 font-semibold">
                Start free
              </Link>
              <Link
                to="/login"
                className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-jira border border-white/50 px-4 py-2 text-14 font-semibold text-white transition-colors hover:bg-white/10"
              >
                View demo
                <TargetIcon className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid w-full gap-6 rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm sm:grid-cols-3 dark:border-blue-200/20 dark:bg-blue-900/30">
              {highlights.map((highlight) => (
                <div key={highlight.label} className="rounded-2xl bg-white/10 p-4 text-left dark:bg-blue-950/40">
                  <p className="text-3xl font-semibold text-white drop-shadow-lg">{highlight.value}</p>
                  <p className="mt-1 text-sm text-white/70">{highlight.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="section-title">Everything teams need to stay aligned</h2>
            <p className="mx-auto mt-2 max-w-2xl text-14 text-neutral-700 dark:text-neutral-300">
              Plan, discuss, and document with a unified toolkit. Each surface is designed to keep velocity high without sacrificing clarity.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="card h-full rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-soft transition-transform duration-150 hover:-translate-y-1 dark:border-neutral-800 dark:bg-neutral-950/80"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-jira-50 text-jira-600 dark:bg-jira-600/20 dark:text-jira-200">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-1000 dark:text-neutral-0">{feature.title}</h3>
                  <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white py-20 dark:bg-neutral-950">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 text-center">
              <h2 className="section-title">Why teams switch to AISR</h2>
              <p className="mx-auto mt-2 max-w-2xl text-14 text-neutral-700 dark:text-neutral-300">
                Designed for scale, loved by fast-moving squads. AISR removes silos so work and knowledge live side by side.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                <div
                  key={pillar.title}
                  className="rounded-2xl border border-neutral-200 bg-neutral-100 p-6 transition hover:bg-neutral-0 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-jira-50 text-jira-600 dark:bg-jira-600/20 dark:text-jira-200">
                    <Icon className="h-6 w-6" />
                  </div>
                    <h3 className="text-lg font-semibold text-neutral-1000 dark:text-neutral-0">{pillar.title}</h3>
                    <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{pillar.description}</p>
                </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 text-center">
          <div className="rounded-3xl bg-[radial-gradient(circle_at_top_left,#60a5fa_0%,transparent_55%)] p-[1px] shadow-soft dark:bg-[radial-gradient(circle_at_top_left,#1d4ed8_0%,transparent_60%)]">
            <div className="relative h-full w-full rounded-[inherit] bg-gradient-to-br from-jira-600 via-jira-500 to-status-purple p-16 text-white shadow-soft dark:bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#2563eb_100%)] dark:text-neutral-50 dark:shadow-none">
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.25),transparent_70%)] opacity-0 dark:opacity-100" />
            <h2 className="text-3xl font-semibold md:text-4xl">Ready to give teams a shared source of truth?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
              Launch a collaborative workspace where projects, documents, and conversations live together.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary min-w-[180px] justify-center text-14 font-semibold">
                Create free account
              </Link>
              <Link
                to="/login"
                className="inline-flex min-w-[180px] items-center justify-center rounded-jira border border-white/60 px-4 py-2 text-14 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-300 bg-white py-8 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-6 text-12 text-neutral-600 dark:text-neutral-300">
          <p>&copy; {new Date().getFullYear()} AISR. All rights reserved.</p>
          <p>Made for teams who care about velocity and clarity.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
