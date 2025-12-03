import React, { useState, useEffect } from 'react';

const CharacterZone = ({ currentLang, setLang, status, text, isTextVisible, tailRotation = "180deg" }) => {
  
  const [displayedText, setDisplayedText] = useState("");
  const typingSpeed = 40; // ความเร็วในการพิมพ์ (ms ต่อ 1 ตัวอักษร)

  // --- Logic Typewriter Effect ---
  useEffect(() => {
    if (isTextVisible && text) {
      let i = 0;
      setDisplayedText(""); // เคลียร์ของเก่าเพื่อเริ่มพิมพ์ใหม่

      const timer = setInterval(() => {
        i++;
        // ตัดข้อความจากตัวแรกถึงตัวที่ i
        setDisplayedText(text.slice(0, i));

        if (i >= text.length) {
          setDisplayedText(text); 
          clearInterval(timer);
        }
      }, typingSpeed);

      return () => clearInterval(timer); // Cleanup
    } 
  }, [text, isTextVisible]);

  // ฟังก์ชันเลือกไฟล์วิดีโอ
  const getVideoSource = () => {
    // ** ตรวจสอบว่าไฟล์วิดีโออยู่ในโฟลเดอร์ public/assets จริงหรือไม่ **
    switch (status) {
      case 'thinking': return '/assets/char-thinking.mp4';
      case 'talking':  return '/assets/char-talking.mp4';
      case 'idle': default: return '/assets/char-idle.mp4';
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      
      {/* Layer 1: Video (Background) */}
      <video
        key={status} // Key เปลี่ยนเพื่อให้ React รีเซ็ต Player เมื่อสถานะเปลี่ยน
        className="char-video-player"
        autoPlay loop muted playsInline
        style={{ 
          width: '100%', height: '100%', 
          objectFit: 'cover',
          position: 'absolute', top: 0, left: 0,
          zIndex: 1 // Background layer
        }}
      >
        <source src={getVideoSource()} type="video/mp4" />
      </video>

      {/* Layer 2: Bubble Text (Foreground) */}
     {displayedText && ( 
        <div 
          className={`char-floating-bubble ${!isTextVisible && status !== 'thinking' ? 'fade-out' : ''}`}
          style={{ zIndex: 10, whiteSpace: 'pre-line', '--tail-rotation': tailRotation,}} 
        >
           {displayedText}
           {/* Cursor กระพริบปิดท้าย */}
           <span className="cursor-blink">|</span>
        </div>
      )}

      {/* Layer 3: Language Switcher (Floating) */}
      <div className="lang-switcher-floating" style={{ zIndex: 20 }}>
        {['TH', 'EN', 'JP'].map((lang) => (
          <button 
            key={lang}
            onClick={() => setLang && setLang(lang)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              background: currentLang === lang ? '#333' : 'rgba(255,255,255,0.6)',
              color: currentLang === lang ? '#fff' : '#333',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.8rem',
              backdropFilter: 'blur(4px)',
              transition: '0.2s',
              boxShadow: currentLang === lang ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
            }}
          >
            {lang}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CharacterZone;