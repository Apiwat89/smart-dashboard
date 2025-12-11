import React, { useState, useEffect, useRef } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';

const CharacterZone = ({ status, text, isTextVisible, countdown, onClose, lang, onSpeechEnd}) => {
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

  // 3. ✨ Logic การพูด (ปรับจูนให้หาเสียงผู้หญิง)
  useEffect(() => {
    if (status !== 'talking') return;

    // Check พื้นฐาน
    if (isMuted || !isTextVisible || !text || availableVoices.length === 0) {
       const fakeDuration = Math.max(2000, text ? text.length * 80 : 2000);
       const timer = setTimeout(() => {
           if (onSpeechEnd) onSpeechEnd();
       }, fakeDuration);
       return () => clearTimeout(timer);
    }

    synthesisRef.current.cancel();

    // Helper: สร้าง Utterance
    const createUtterance = (textToSpeak, preferredVoice = null) => {
      const u = new SpeechSynthesisUtterance(textToSpeak);
      u.rate = 0.8; // ความเร็ว (1.0 = ปกติ)
      u.pitch = 1.1; // ✨ เพิ่ม Pitch นิดนึง (1.1-1.2) ให้เสียงดูเป็นผู้หญิง/สดใสขึ้น
      
      if (preferredVoice) {
        u.voice = preferredVoice;
        u.lang = preferredVoice.lang;
      }
      return u;
    };

    const targetLangCode = { 'TH': 'th', 'EN': 'en', 'JP': 'ja' }[lang] || 'th';
    
    // ✨✨ KEY CHANGE: ล็อคเป้าเสียงผู้หญิง (Prioritize Female Voices) ✨✨
    // 1. Google (เสียง Google ภาษาไทยส่วนใหญ่เป็นผู้หญิง)
    // 2. Microsoft Premwadee / Achara (เสียงผู้หญิงของ Microsoft)
    // 3. Samantha / Zira (เสียงผู้หญิงภาษาอังกฤษ)
    const primaryVoice = 
         // หา Google ก่อน (ดีที่สุด)
         availableVoices.find(v => v.lang.toLowerCase().includes(targetLangCode) && v.name.includes('Google')) 
         // หาเสียงผู้หญิง Microsoft ไทย (Premwadee / Achara)
      || availableVoices.find(v => v.lang.toLowerCase().includes(targetLangCode) && (v.name.includes('Premwadee') || v.name.includes('Achara')))
         // หาเสียงผู้หญิงสากล (ถ้าเป็น Eng)
      || availableVoices.find(v => v.lang.toLowerCase().includes(targetLangCode) && (v.name.includes('Samantha') || v.name.includes('Zira')))
         // ถ้าไม่เจอจริงๆ เอาอะไรก็ได้ที่ตรงภาษา
      || availableVoices.find(v => v.lang.toLowerCase().includes(targetLangCode));

    const utterance = createUtterance(text, primaryVoice);

    console.log(`🗣️ Selected Voice: ${primaryVoice ? primaryVoice.name : 'System Default'}`);

    // Error Handling (Retry)
    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      console.warn("⚠️ Voice Failed, Retrying with Default...");
      
      const retryUtterance = createUtterance(text, null); 
      retryUtterance.onend = () => { if (onSpeechEnd) onSpeechEnd(); };
      
      synthesisRef.current.cancel();
      setTimeout(() => synthesisRef.current.speak(retryUtterance), 100);
    };

    utterance.onend = () => {
      console.log("✅ Speech finished");
      if (onSpeechEnd) onSpeechEnd();
    };

    const timer = setTimeout(() => {
      synthesisRef.current.speak(utterance);
    }, 50);

    return () => {
      clearTimeout(timer);
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