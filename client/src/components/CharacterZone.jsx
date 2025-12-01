import React from 'react';
import { MessageCircle } from 'lucide-react'; // ไอคอนตกแต่ง

const CharacterZone = ({ currentLang, setLang, status }) => {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* 1. ส่วนเลือกภาษา */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {['TH', 'EN', 'JP'].map((lang) => (
          <button 
            key={lang}
            onClick={() => setLang(lang)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: currentLang === lang ? '#fff' : 'rgba(255,255,255,0.3)',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: '0.3s'
            }}
          >
            {lang}
          </button>
        ))}
      </div>

      {/* 2. ตัวการ์ตูน (Placeholder) */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        position: 'relative'
      }}>
        {/* ใส่รูปจริงตรงนี้แทน div วงกลม */}
        <div style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          backgroundColor: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '5rem',
          boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
          animation: status === 'talking' ? 'bounce 0.5s infinite' : 'none'
        }}>
          {status === 'thinking' ? '🤔' : (status === 'talking' ? '🗣️' : '🤖')}
        </div>
        
        {/* กล่องคำพูดลอยๆ */}
        {status === 'talking' && (
           <div style={{ position: 'absolute', top: '-20px', right: '-20px' }}>
             <MessageCircle size={40} fill="white" color="#333"/>
           </div>
        )}
      </div>

      <div style={{ marginTop: '20px', color: 'white', fontWeight: 'bold' }}>
        Status: {status.toUpperCase()}
      </div>
      
      {/* CSS Animation แบบบ้านๆ */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default CharacterZone;