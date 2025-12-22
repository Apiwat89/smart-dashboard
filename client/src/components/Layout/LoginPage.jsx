import React from 'react';
import { LayoutDashboard, ShieldCheck, Sparkles } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  return (
    <div className="login-container">
      {/* Background Shapes (ตกแต่งพื้นหลัง) */}
      <div className="shape shape-1"></div>
      <div className="shape shape-2"></div>

      <div className="login-card">
        {/* ฝั่งซ้าย: Branding & Visual */}
        <div className="login-visual">
          <div className="visual-content">
            <div className="logo-badge">
                <img src="./logo2.png" alt="" />
            </div>
            <h1>Somjeed Dashboard</h1>
            <p>ระบบวิเคราะห์ข้อมูลอัจฉริยะ พร้อมผู้ช่วย AI<br/>ที่จะทำให้การตัดสินใจของคุณง่ายขึ้น</p>
            
            <div className="feature-list">
                <div className="feature-item">
                    <Sparkles size={18} /> AI-Powered Summary
                </div>
                <div className="feature-item">
                    <ShieldCheck size={18} /> Enterprise Security
                </div>
            </div>
          </div>
          
          {/* Overlay Effect */}
          <div className="visual-overlay"></div>
        </div>

        {/* ฝั่งขวา: Login Action */}
        <div className="login-action">
          <div className="login-header">
             <h2>Wellcome! 👋</h2>
             <p>กรุณาล็อกอินด้วยบัญชีองค์กรเพื่อเข้าใช้งาน</p>
          </div>

          <button onClick={onLogin} className="ms-login-btn">
            <img 
                src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" 
                alt="Microsoft Logo" 
                className="ms-logo"
            />
            <span>Sign in with Microsoft</span>
          </button>

          <div className="login-footer">
             <p>Powered by <strong>Somjeed Team</strong></p>
             <span className="version">v1.0.0 (Beta)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;