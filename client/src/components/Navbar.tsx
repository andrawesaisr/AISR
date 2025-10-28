import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-lg font-bold">AISR</Link>
        <div>
          <Link to="/projects" className="text-gray-300 hover:text-white mr-4">Projects</Link>
          <Link to="/documents" className="text-gray-300 hover:text-white mr-4">Documents</Link>
          <Link to="/my-tasks" className="text-gray-300 hover:text-white mr-4">My Tasks</Link>
          <Link to="/organizations" className="text-gray-300 hover:text-white">Organizations</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
