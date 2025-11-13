import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-1000 transition-colors duration-150 dark:bg-neutral-1000 dark:text-neutral-0">
      <Sidebar />
      <div className="ml-64 transition-colors duration-150">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
