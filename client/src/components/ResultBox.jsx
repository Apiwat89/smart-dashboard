import React from 'react';

const ResultBox = ({ text }) => {
  return (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ color: '#555', marginBottom: '10px' }}>💡 มุมมองจากน้อง AI</h3>
      <div style={{ 
        fontSize: '1.2rem', 
        color: '#333', 
        minHeight: '60px',
        padding: '10px',
        backgroundColor: '#f9f9f9',
        borderRadius: '10px',
        borderLeft: '5px solid #82ca9d'
      }}>
        {text || "คลิกที่กราฟด้านบน เพื่อให้น้องวิเคราะห์ข้อมูล..."}
      </div>
    </div>
  );
};

export default ResultBox;