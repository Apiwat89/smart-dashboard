import React, { useState, useEffect } from 'react';
import { Zap, Server, BrainCircuit } from 'lucide-react';

const LOADING_TEXTS = [
  "กำลังเชื่อมต่อฐานข้อมูล...",
  "กำลังปลุกน้องออร่า...",
  "กำลังวิเคราะห์กราฟ...",
  "เตรียมความพร้อมระบบ AI...",
  "เข้าสู่ Dashboard..."
];

const LoadingScreen = () => {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % LOADING_TEXTS.length);
    }, 1100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-container">
      {/* Background Decor */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <div className="loading-content">
        {/* Main Logo & Rings */}
        <div className="logo-wrapper">
          <div className="spin-ring ring-1"></div>
          <div className="spin-ring ring-2"></div>
          <div className="icon-box">
            <img src="./logo.png" alt="Logo" />
          </div>

          {/* Orbit Icons */}
          <div className="orbit-icon orbit-1"><Zap size={16} /></div>
          <div className="orbit-icon orbit-2"><Server size={16} /></div>
          <div className="orbit-icon orbit-3"><BrainCircuit size={16} /></div>
        </div>

        {/* Text & Progress */}
        <h2 className="loading-title">Insight Aura Dashboard</h2>
        <div className="loading-status">
          <span className="status-text key-anim">{LOADING_TEXTS[textIndex]}</span>
        </div>

        <div className="progress-bar-wrapper">
          <div className="progress-bar-fill"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;