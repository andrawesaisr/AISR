import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('aisr:sidebar:collapsed');
      if (stored === 'true') {
        setSidebarCollapsed(true);
      }
    } catch (err) {
      console.warn('Unable to read sidebar settings from storage', err);
    }
  }, []);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('aisr:sidebar:collapsed', next ? 'true' : 'false');
      } catch (err) {
        console.warn('Unable to persist sidebar settings', err);
      }
      return next;
    });
  };

  const contentOffsetClass = useMemo(
    () => (sidebarCollapsed ? 'ml-16' : 'ml-64'),
    [sidebarCollapsed]
  );

  if (!isAuthenticated) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-1000 transition-colors duration-150 dark:bg-neutral-1000 dark:text-neutral-0">
      <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />
      <div
        className={`${contentOffsetClass} transition-[margin] duration-200 ease-out md:transition-[margin]`}
      >
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
