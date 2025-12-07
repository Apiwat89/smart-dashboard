import React from 'react';

const LoadingScreen = () => (
  <div className="loading-screen">
    <div style={{position: 'relative'}}>
       <div className="pulse-ring"></div>
       <div className="loading-logo-wrapper">S</div>
    </div>
    <div className="loading-text-container">
       <div className="loading-title">SOMJEED DASHBOARD</div>
       <div className="loading-sub">Preparing insights for you...</div>
       <div className="loading-bar-wrapper"><div className="loading-bar-fill"></div></div>
    </div>
  </div>
);
export default LoadingScreen;