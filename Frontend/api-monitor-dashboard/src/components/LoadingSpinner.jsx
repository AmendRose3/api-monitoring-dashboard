import React from 'react';
import { RefreshCw } from 'lucide-react';

const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="loading-content">
      <RefreshCw className="loading-spinner" size={24} color="#2563eb" />
      <span className="loading-text">Loading dashboard...</span>
    </div>
  </div>
);

export default LoadingSpinner;
