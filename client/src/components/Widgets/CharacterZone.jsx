import React, { useState, useEffect, useRef } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';

const CharacterZone = ({ status, text, isTextVisible, countdown, onClose, lang }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const synthesisRef = useRef(window.speechSynthesis);
  const [availableVoices, setAvailableVoices] = useState([]);

  // 1. โหลดรายชื่อเสียง (Load Voices)
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };
    
    loadVoices();
    // Chrome/Edge ต้องการ event นี้
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // 2. Typewriter Effect
  useEffect(() => {
    if (isTextVisible && text) {
      let i = 0;
      setDisplayedText(""); 
      const timer = setInterval(() => {
        i++;
        setDisplayedText(text.slice(0, i));
        if (i >= text.length) clearInterval(timer);
      }, 30);
      return () => clearInterval(timer); 
    } 
  }, [text, isTextVisible]);

  // 3. ✨ Logic การพูด (แก้ไขใหม่ให้เลือกเสียงแม่นยำ)
  useEffect(() => {
    if (isMuted || !isTextVisible || !text || status !== 'talking') {
      synthesisRef.current.cancel();
      return;
    }
    
    if (availableVoices.length === 0) return;

    // หยุดเสียงเก่า
    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // แปลงรหัสภาษา (เช่น TH -> th-TH)
    const targetLangCode = {
      'TH': 'th',
      'EN': 'en',
      'JP': 'ja'
    }[lang] || 'th';

    // ✨ FIX: วิธีเลือกเสียงแบบยืดหยุ่น (Fuzzy Matching)
    // 1. หาเสียง Google ที่ตรงภาษา (ดีที่สุด)
    // 2. ถ้าไม่มี หาเสียงอะไรก็ได้ที่ตรงภาษา (เช่น Microsoft, Apple)
    // 3. เช็คทั้ง 'th-TH' และ 'th_TH'
    const voice = availableVoices.find(v => v.name.includes('Google') && v.lang.toLowerCase().includes(targetLangCode)) 
               || availableVoices.find(v => v.lang.toLowerCase().includes(targetLangCode));

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang; // ตั้งค่า lang ตามเสียงที่เจอจริงๆ
      console.log(`🗣️ ใช้เสียง: ${voice.name} (${voice.lang})`);
    } else {
      console.warn(`⚠️ หาเสียงภาษา ${targetLangCode} ไม่เจอ ระบบอาจใช้เสียง Default`);
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    synthesisRef.current.speak(utterance);

    return () => {
      synthesisRef.current.cancel();
    };
  }, [text, status, isTextVisible, isMuted, lang, availableVoices]);

  // ... (ส่วน getVideoSource และ return คงเดิม) ...
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
        key={status}
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
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="bubble-close-btn" 
                title={isMuted ? "Unmute" : "Mute"}
                style={{marginRight: '5px'}}
              >
                  <div style={{display:'flex'}}>
                    {isMuted ? <VolumeX size={14}/> : <Volume2 size={14}/>}
                  </div>
              </button>

              <button onClick={onClose} className="bubble-close-btn" title="Close">
                  <div style={{display:'flex'}}><X size={14}/></div>
              </button>
              
              <span style={{marginLeft: 'auto'}}>Auto close in {countdown}s</span> 
           </div>
        </div>
      )}
      
      <style>{`
        .bubble-close-btn {
          background: rgba(0,0,0,0.05); border: none; border-radius: 50%;
          width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #888; transition: 0.2s;
        }
        .bubble-close-btn:hover { background: #ff7675; color: white; }
        .bubble-timer { display: flex; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; font-size: 0.7rem; color: #999; }
      `}</style>
    </div>
  );
};

export default CharacterZone;