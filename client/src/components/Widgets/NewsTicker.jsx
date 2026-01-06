import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

const NewsTicker = ({ text, type = 'info' }) => {
  if (!text) return null;

  const isAlert = type === 'alert';
  const labelColor = isAlert ? '#ff4757' : '#00c49f';

  return (
    <div className="ticker-container">
      <div className="ticker-label" style={{ backgroundColor: labelColor }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAlert ? <AlertTriangle size={18} /> : <Info size={18} />}
          
          {/* 👇 แก้ไขตรงนี้ครับ ให้แสดงคำตามประเภทที่ส่งมา 👇 */}
          {isAlert ? 'CRITICAL ALERT' : 'LATEST UPDATE'}
          {/* 👆 หรือถ้าอยากให้เปลี่ยนตามภาษา ให้ใช้ UI_TEXT[lang] มาใส่แทนก็ได้ครับ */}
        </span>
      </div>

      <div className="ticker-track">
        <div className="ticker-content">
          {text} &nbsp;&nbsp; • &nbsp;&nbsp; {text} &nbsp;&nbsp; • &nbsp;&nbsp; {text}
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;