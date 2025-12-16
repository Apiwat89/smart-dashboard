import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Zap, Server, BrainCircuit } from 'lucide-react';

const LoadingScreen = () => {
  // ข้อความที่จะเปลี่ยนไปเรื่อยๆ
  const loadingTexts = [
    "กำลังเชื่อมต่อฐานข้อมูล...",
    "กำลังปลุกน้องส้มจี๊ด...",
    "กำลังวิเคราะห์กราฟน้ำท่วม...",
    "เตรียมความพร้อมระบบ AI...",
    "เข้าสู่ Dashboard..."
  ];

  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 1100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-container">
      {/* Background Shapes (ลูกเล่นพื้นหลัง) */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <div className="loading-content">
        {/* ตัวโลโก้หลัก (มีวงแหวนหมุนๆ) */}
        <div className="logo-wrapper">
            <div className="spin-ring ring-1"></div>
            <div className="spin-ring ring-2"></div>
            <div className="icon-box">
                <LayoutDashboard size={48} color="white" className="pulse-icon" />
            </div>
            
            {/* ไอคอนลอยๆ รอบตัว */}
            <div className="orbit-icon orbit-1"><Zap size={16} /></div>
            <div className="orbit-icon orbit-2"><Server size={16} /></div>
            <div className="orbit-icon orbit-3"><BrainCircuit size={16} /></div>
        </div>

        {/* Text Animation */}
        <h2 className="loading-title">Somjeed Dashboard</h2>
        <div className="loading-status">
            <span className="status-text key-anim">{loadingTexts[textIndex]}</span>
        </div>

        {/* Loading Bar */}
        <div className="progress-bar-wrapper">
            <div className="progress-bar-fill"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;