import React from 'react';

type LoadingStateProps = {
  label?: string;
};

const LoadingState: React.FC<LoadingStateProps> = ({ label = 'Loading...' }) => (
  <div className="loading-state h-96">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-jira-500" />
    <p className="text-sm font-medium">{label}</p>
  </div>
);

export default LoadingState;
