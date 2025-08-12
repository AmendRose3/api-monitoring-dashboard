import React from 'react';
import Lottie from "lottie-react";
import cricketAnimation from "../assets/cricket-loading.json";

const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="loading-content">
      <Lottie animationData={cricketAnimation} loop={true} style={{ width: 80, height: 80 }} />
      <span className="loading-text">Loading dashboard...</span>
    </div>
  </div>
);

export default LoadingSpinner;
