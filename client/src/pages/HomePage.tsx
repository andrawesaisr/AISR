import React from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, FileText, Presentation, Zap, Users, Shield } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">AISR</span>
          </div>
          <div className="flex gap-4">
            <Link to="/login" className="btn-ghost">Login</Link>
            <Link to="/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Your All-in-One
          <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent"> Workspace</span>
        </h1>
                  <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                  Combine the power of Jira and Notion in one beautiful platform. 
                  Manage projects and create documents - all in one place.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link to="/register" className="btn-primary text-lg px-8 py-3">
                    Start Free Trial
                  </Link>
                  <Link to="/login" className="btn-secondary text-lg px-8 py-3">
                    Sign In
                  </Link>
                </div>
              </section>
        
              {/* Features */}
              <section className="max-w-7xl mx-auto px-6 py-20">
                <h2 className="text-4xl font-bold text-center mb-16">Everything you need, nothing you don't</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="card text-center">
                    <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FolderKanban className="text-primary-600" size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Project Management</h3>
                    <p className="text-gray-600">Task tracking and team collaboration like Jira</p>
                  </div>
                  <div className="card text-center">
                    <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="text-secondary-600" size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Rich Documents</h3>
                    <p className="text-gray-600">Create beautiful docs and wikis with a Notion-style editor</p>
                  </div>
                </div>
              </section>
      {/* Benefits */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Why teams love AISR</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="text-primary-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Lightning Fast</h3>
                <p className="text-gray-600">Built for speed with modern technology</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="text-secondary-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Real-time Collaboration</h3>
                <p className="text-gray-600">Work together seamlessly with your team</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Secure & Private</h3>
                <p className="text-gray-600">Your data is encrypted and protected</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-3xl p-16 text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of teams already using AISR</p>
          <Link to="/register" className="inline-block bg-white text-primary-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600">
          <p>&copy; 2024 AISR. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
