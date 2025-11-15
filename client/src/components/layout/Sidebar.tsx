import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Squares2X2Icon as LayoutDashboard,
  FolderIcon as FolderKanban,
  DocumentTextIcon as FileText,
  UsersIcon as Users,
  BuildingOffice2Icon as Building2,
  Cog6ToothIcon as Settings,
  ArrowRightOnRectangleIcon as LogOut,
  PlusIcon as Plus,
  SunIcon as Sun,
  MoonIcon as Moon,
  ComputerDesktopIcon as Monitor,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/documents', icon: FileText, label: 'Documents' },
    { path: '/organizations', icon: Building2, label: 'Organizations' },
    // { path: '/team', icon: Users, label: 'Team' },
  ];

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const ThemeGlyph = theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun;
  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
  const themeLabel =
    theme === 'system'
      ? `System - ${resolvedTheme === 'dark' ? 'Dark' : 'Light'}`
      : `${theme.charAt(0).toUpperCase()}${theme.slice(1)}`;
  const quickToggleLabel =
    nextTheme === 'dark' ? 'Switch to dark mode' : 'Switch to light mode';
  const toggleSidebarLabel = collapsed ? 'Open sidebar' : 'Close sidebar';
  const sidebarWidthClass = collapsed ? 'w-16' : 'w-64';
  const contentAlignment = collapsed ? 'items-center' : 'items-start';

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className={`${sidebarWidthClass} bg-white border-r border-neutral-300 h-screen fixed left-0 top-0 flex flex-col transition-all duration-200 ease-out dark:bg-neutral-950 dark:border-neutral-800`}
    >
      {/* Logo - Jira Style */}
      <div className={`relative px-4 py-3 border-b border-neutral-300 ${contentAlignment}`}>
        <Link
          to="/dashboard"
          className={`flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 p-1 rounded-jira transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/imgages/aisr.png" alt="AISR Logo" className="w-8 h-8 object-contain" />
          </div>
          <div className={collapsed ? 'sr-only' : ''}>
            <h1 className="text-14 font-semibold text-neutral-1000">AISR</h1>
            <p className="text-11 text-neutral-700">Team Project</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-jira border border-neutral-300 text-neutral-600 transition-colors hover:bg-neutral-200 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          aria-label={toggleSidebarLabel}
          title={toggleSidebarLabel}
        >
          {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
        </button>
      </div>

      {/* Quick Actions - Jira Style */}
      <div className={`px-3 py-2 border-b border-neutral-300 ${contentAlignment}`}>
        <Link
          to="/new-project"
          className={`btn-primary ${collapsed ? 'h-10 w-10 rounded-full !px-0 !py-0 justify-center' : 'w-full gap-1 text-12'}`}
          title={collapsed ? 'Create project' : undefined}
          aria-label="Create project"
        >
          <Plus className="w-4 h-4" />
          <span className={collapsed ? 'sr-only' : ''}>Create</span>
        </Link>
      </div>

      {/* Navigation - Jira Style */}
      <nav className={`flex-1 px-2 py-2 space-y-0.5 ${collapsed ? 'items-center' : ''}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${collapsed ? 'justify-center' : ''} ${
                active ? 'sidebar-link-active' : ''
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4" />
              <span className={collapsed ? 'sr-only' : 'text-14'}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions - Jira Style */}
      <div className={`px-2 py-2 border-t border-neutral-300 space-y-0.5 dark:border-neutral-800 ${collapsed ? 'items-center' : ''}`}>
        <button
          type="button"
          className={`sidebar-link w-full ${collapsed ? 'justify-center' : 'justify-between'}`}
          onClick={() => setTheme(nextTheme)}
          title={quickToggleLabel}
        >
          <span className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
            <ThemeGlyph className="w-4 h-4" />
            <span className={collapsed ? 'sr-only' : 'text-14'}>Theme</span>
          </span>
          {!collapsed && (
            <span className="text-12 text-neutral-600 dark:text-neutral-300">{themeLabel}</span>
          )}
        </button>
        <Link
          to="/settings"
          className={`sidebar-link ${collapsed ? 'justify-center' : ''} ${
            isActive('/settings') ? 'sidebar-link-active' : ''
          }`}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="w-4 h-4" />
          <span className={collapsed ? 'sr-only' : 'text-14'}>Settings</span>
        </Link>
        <button 
          onClick={() => {
            logout();
            navigate('/');
          }}
          className={`sidebar-link w-full text-status-red hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950 ${
            collapsed ? 'justify-center text-center' : 'text-left'
          }`}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="w-4 h-4" />
          <span className={collapsed ? 'sr-only' : 'text-14'}>Sign out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
