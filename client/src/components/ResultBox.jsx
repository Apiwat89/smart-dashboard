import React from 'react';

const ResultBox = ({ text }) => {
  return (
    <div style={{ width: '100%' }}>
      <h3 style={{ color: '#444', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>💡</span> มุมมองภาพรวม (AI Analysis)
      </h3>
      
      <div style={{ 
        fontSize: '1.1rem', 
        color: '#333', 
        lineHeight: '1.6',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        borderLeft: '6px solid #82ca9d',
        whiteSpace: 'pre-line' // รองรับการขึ้นบรรทัดใหม่จาก \n
      }}>
        {text || "กำลังรอข้อมูล..."}
      </div>
    </div>
  );
};

export default ResultBox;