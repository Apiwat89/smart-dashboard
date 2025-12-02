import React from 'react';
import { MessageCircle } from 'lucide-react';

const CharacterZone = ({ currentLang, setLang, status }) => {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* ปุ่มเลือกภาษา */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '25px' }}>
        {['TH', 'EN', 'JP'].map((lang) => (
          <button 
            key={lang}
            onClick={() => setLang(lang)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              background: currentLang === lang ? '#fff' : 'rgba(255,255,255,0.25)',
              color: currentLang === lang ? '#333' : '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: '0.2s',
              boxShadow: currentLang === lang ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {lang}
          </button>
        ))}
      </div>

      {/* Avatar Animation */}
      <div style={{ position: 'relative' }}>
        <div style={{
          width: '180px', height: '180px', 
          borderRadius: '50%', 
          backgroundColor: 'white',
          display: 'flex', justifyContent: 'center', alignItems: 'center', 
          fontSize: '5rem',
          boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: status === 'talking' ? 'scale(1.1)' : 'scale(1)'
        }}>
          {status === 'thinking' ? '🤔' : (status === 'talking' ? '🗣️' : '🤖')}
        </div>
        
        {/* ไอคอนเด้งดึ๋งตอนพูด */}
        {status === 'talking' && (
           <div style={{ position: 'absolute', top: '-10px', right: '-10px', animation: 'bounce 1s infinite' }}>
             <MessageCircle size={45} fill="#FF6B6B" color="#fff" strokeWidth={1.5} />
           </div>
        )}
      </div>

      <div style={{ marginTop: '20px', color: 'white', fontWeight: '600', letterSpacing: '1px', opacity: 0.8 }}>
        {status === 'idle' ? 'STANDBY' : status.toUpperCase()}
      </div>
      
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
};

export default CharacterZone;