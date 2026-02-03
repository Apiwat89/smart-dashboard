import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  return (
    <div className="login-container">
      {/* Background Shapes */}
      <div className="shape shape-1"></div>
      <div className="shape shape-2"></div>

      <div className="login-card">
        {/* Left Side: Visuals */}
        <div className="login-visual">
          <div className="visual-content">
            <div className="logo-badge">
              <video 
                src="./logo.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline
              />
            </div>
            <h1>EZ Dashboard</h1>
            <p>
              ระบบวิเคราะห์ข้อมูลอัจฉริยะ พร้อมผู้ช่วย AI<br />
              ที่จะทำให้การตัดสินใจของคุณง่ายขึ้น
            </p>

            <div className="feature-list">
              <div className="feature-item">
                <Sparkles size={18} /> AI-Powered Summary
              </div>
              <div className="feature-item">
                <ShieldCheck size={18} /> Enterprise Security
              </div>
            </div>
          </div>
          <div className="visual-overlay"></div>
        </div>

        {/* Right Side: Login Action */}
        <div className="login-action">
          <div className="login-header">
            <h2>Welcome!</h2>
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
            <p>Powered by <strong>Digital HR Team</strong></p>
            <span className="version">v1.0.0 (Beta)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;