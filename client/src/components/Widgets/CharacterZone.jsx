import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CharacterZone = ({ status, text, isTextVisible, countdown, onClose }) => {
  const [displayedText, setDisplayedText] = useState("");

  // Typewriter Effect
  useEffect(() => {
    if (isTextVisible && text) {
      let i = 0;
      setDisplayedText(""); 
      const timer = setInterval(() => {
        i++;
        setDisplayedText(text.slice(0, i));
        if (i >= text.length) clearInterval(timer);
      }, 30); // Speed up slightly
      return () => clearInterval(timer); 
    } 
  }, [text, isTextVisible]);

  const getVideoSource = () => {
    const map = {
      thinking: './assets/char-thinking.mp4',
      talking: './assets/char-talking.mp4',
      idle: './assets/char-idle.mp4'
    };
    return map[status] || map.idle;
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <video
        key={status} // Force re-render on status change
        className="char-video-player"
        autoPlay loop muted playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, zIndex: 1 }}
      >
        <source src={getVideoSource()} type="video/mp4" />
      </video>

      {isTextVisible && ( 
        <div className="char-floating-bubble" style={{ zIndex: 10 }}>
           <div className="bubble-content">
              {displayedText}<span className="cursor-blink"> </span>
           </div>
           
           <div className="bubble-timer">
              <button onClick={onClose} className="bubble-close-btn" title="Close">
                  <div style={{display:'flex'}}><X size={14}/></div>
              </button>
              <span>Auto close in {countdown}s</span> 
           </div>
        </div>
      )}
      
      {/* Inline styles for specific small elements */}
      <style>{`
        .bubble-close-btn {
          background: rgba(0,0,0,0.05); border: none; border-radius: 50%;
          width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #888; transition: 0.2s;
        }
        .bubble-close-btn:hover { background: #ff7675; color: white; }
        .bubble-timer { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; font-size: 0.7rem; color: #999; }
      `}</style>
    </div>
  );
};

export default CharacterZone;