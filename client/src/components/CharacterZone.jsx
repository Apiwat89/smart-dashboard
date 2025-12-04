import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CharacterZone = ({ status, text, isTextVisible, countdown, tailRotation = "180deg", onClose}) => {
  
  const [displayedText, setDisplayedText] = useState("");
  const typingSpeed = 40; 

  // Typewriter Logic
  useEffect(() => {
    if (isTextVisible && text) {
      let i = 0;
      setDisplayedText(""); 
      const timer = setInterval(() => {
        i++;
        setDisplayedText(text.slice(0, i));
        if (i >= text.length) {
          setDisplayedText(text); 
          clearInterval(timer);
        }
      }, typingSpeed);
      return () => clearInterval(timer); 
    } 
  }, [text, isTextVisible]);

  const getVideoSource = () => {
    switch (status) {
      case 'thinking': return '/assets/char-thinking.mp4';
      case 'talking':  return '/assets/char-talking.mp4';
      case 'idle': default: return '/assets/char-idle.mp4';
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Video */}
      <video
        key={status} 
        className="char-video-player"
        autoPlay loop muted playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
      >
        <source src={getVideoSource()} type="video/mp4" />
      </video>

        {/* Bubble Text */}
        {isTextVisible && ( 
        <div 
          className="char-floating-bubble"
          style={{ zIndex: 10, whiteSpace: 'pre-line', '--tail-rotation': tailRotation }} 
        >
           <div className="bubble-content">
              {displayedText}
              <span className="cursor-blink">|</span>
           </div>
           
           <div className="bubble-timer" style={{display:"flex"}}>
              {/* ✨ 3. เพิ่มปุ่ม Close (X) ไว้มุมขวาบน */}
                <button 
                    onClick={onClose}
                    style={{
                        top: '8px',
                        bottom: "0px",
                        background: 'rgba(0,0,0,0.1)', // สีพื้นจางๆ
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#666',
                        transition: '0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#ff7675'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.1)'; e.currentTarget.style.color = '#666'; }}
                >
                    <X size={14} />
                </button>

              <div>Auto close in {countdown}s</div> 
           </div>
        </div>
      )}

    </div>
  );
};

export default CharacterZone;