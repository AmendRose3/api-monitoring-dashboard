// LoadingSpinner.tsx
import React from 'react';
import Lottie from 'lottie-react';

import cricketAnimation from '../assets/cricket-loading.json' with { type: 'json' };

const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-container">
      <div className="loading-content">
        {/* @ts-ignore */}
        <Lottie
          animationData={cricketAnimation as any}
          loop={true}
          style={{ width: 80, height: 80 }}
        />
        <span className="loading-text">Loading dashboard...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
