import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileText, 
  Presentation,
  Users,
  Building2,
  Settings,
  LogOut,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout, isAuthenticated } = useAuth();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/documents', icon: FileText, label: 'Documents' },
    { path: '/boards', icon: Presentation, label: 'Boards' },
    { path: '/organizations', icon: Building2, label: 'Organizations' },
    { path: '/team', icon: Users, label: 'Team' },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="w-64 bg-white border-r border-neutral-300 h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo - Jira Style */}
      <div className="px-4 py-3 border-b border-neutral-300">
        <Link to="/dashboard" className="flex items-center gap-2 hover:bg-neutral-100 p-1 rounded-jira transition-colors">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/imgages/aisr.png" alt="AISR Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="text-14 font-semibold text-neutral-1000">AISR</h1>
            <p className="text-11 text-neutral-700">Team Project</p>
          </div>
        </Link>
      </div>

      {/* Quick Actions - Jira Style */}
      <div className="px-3 py-2 border-b border-neutral-300">
        <Link 
          to="/projects/new" 
          className="btn-primary w-full gap-1 text-12"
        >
          <Plus size={16} />
          <span>Create</span>
        </Link>
      </div>

      {/* Navigation - Jira Style */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`}
            >
              <Icon size={16} />
              <span className="text-14">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions - Jira Style */}
      <div className="px-2 py-2 border-t border-neutral-300 space-y-0.5">
        <Link to="/settings" className="sidebar-link">
          <Settings size={16} />
          <span className="text-14">Settings</span>
        </Link>
        <button 
          onClick={logout}
          className="sidebar-link w-full text-left text-status-red hover:bg-red-50"
        >
          <LogOut size={16} />
          <span className="text-14">Sign out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
