import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectPage from './pages/ProjectPage';
import NewProjectPage from './pages/NewProjectPage';
import OrganizationsPage from './pages/OrganizationsPage';
import OrganizationPage from './pages/OrganizationPage';
import MyTasksPage from './pages/MyTasksPage';
import DashboardPage from './pages/DashboardPage';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';

import { OrganizationProvider } from './context/OrganizationContext';
import DocumentPage from './pages/DocumentPage';
import DocumentsPage from './pages/DocumentsPage';
import TeamPage from './pages/TeamPage';
import InvitePage from './pages/InvitePage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <OrganizationProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectPage />} />
              <Route path="/new-project" element={<NewProjectPage />} />
              <Route path="/organizations" element={<OrganizationsPage />} />
              <Route path="/organizations/:id" element={<OrganizationPage />} />
              <Route path="/my-tasks" element={<MyTasksPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/documents/:id" element={<DocumentPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/invite/:token" element={<InvitePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Layout>
        </OrganizationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
