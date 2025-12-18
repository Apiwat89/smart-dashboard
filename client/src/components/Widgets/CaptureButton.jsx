import React from 'react'; // ❌ ไม่ต้อง import html2canvas แล้ว (เพราะเราจะใช้ของ App.jsx)
import { Camera } from 'lucide-react';

// ✅ รับ props "onCapture" และ "isCapturing" ที่ส่งมาจาก App.jsx
const CaptureButton = ({ onCapture, isCapturing }) => {
  return (
    <button 
        // ⭐ จุดเปลี่ยนสำคัญ: เรียกฟังก์ชัน onCapture ของแม่ (App.jsx) แทนที่จะทำเอง
        onClick={onCapture} 
        
        disabled={isCapturing}
        title="บันทึกภาพหน้าจอ"
        style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-color)',
            cursor: isCapturing ? 'wait' : 'pointer',
            marginRight: '10px',
            padding: '8px',
            borderRadius: '50%',
            color: 'var(--text-main)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: '0.2s'
        }}
        onMouseEnter={(e) => !isCapturing && (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={(e) => !isCapturing && (e.currentTarget.style.transform = 'scale(1)')}
    >
        {/* ใส่ Effect เต้นๆ ให้รู้ว่ากำลังทำงาน */}
        <Camera size={20} className={isCapturing ? "pulse-icon" : ""} />
    </button>
  );
};

export default CaptureButton;