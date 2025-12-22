import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

const NewsTicker = ({ text, type = 'info' }) => {
  // ถ้าไม่มีข้อความ ไม่ต้องแสดง
  if (!text) return null;

  return (
    <div className="ticker-container">
      {/* ส่วนป้ายด้านซ้าย */}
      <div 
        className="ticker-label" 
        style={{ 
            backgroundColor: type === 'alert' ? '#ff4757' : '#00c49f' 
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {type === 'alert' ? <AlertTriangle size={18} /> : <Info size={18} />}
            {type === 'alert' ? 'CRITICAL ALERT' : 'LATEST UPDATE'}
        </span>
      </div>

      {/* ส่วนตัววิ่ง */}
      <div className="ticker-track">
        <div className="ticker-content">
          {/* เอาข้อความมาต่อกันยาวๆ หน่อย จะได้วิ่งสวยๆ */}
          {text} &nbsp;&nbsp; • &nbsp;&nbsp; {text} &nbsp;&nbsp; • &nbsp;&nbsp; {text}
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;