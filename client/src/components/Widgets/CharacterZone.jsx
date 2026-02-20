import React, { useState, useEffect, useRef } from 'react';
import { dashboardService } from '../../api/apiClient';

const CharacterZone = ({ status, text, lang, onSpeechEnd}) => {
  const [visualState, setVisualState] = useState('idle'); 
  const audioRef = useRef(null); 

  // Preload Videos (คงเดิม)
  useEffect(() => {
    ['./assets/char-thinking.mp4', './assets/char-talking.mp4', './assets/char-idle.mp4'].forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = src;
      document.head.appendChild(link);
    });
  }, []);

  // 2. ปรับฟังก์ชันหยุดเสียงให้ทำงานกับ HTML5 Audio
  const stopSpeaking = () => {
    if (audioRef.current) {
      try { 
        audioRef.current.pause(); 
        audioRef.current.currentTime = 0;
      } catch(e) {}
      audioRef.current = null;
    }
  };

  useEffect(() => {
    let isCancelled = false;

    if (status === 'idle') {
      stopSpeaking();
      setVisualState('idle');
      return;
    }
    if (status === 'thinking') {
      stopSpeaking();
      setVisualState('thinking');
      return;
    }

    if (status === 'talking' && text) {
      setVisualState('thinking'); // ให้แสดงท่ากำลังคิด ระหว่างรอโหลดไฟล์เสียง
      stopSpeaking(); 

      const speak = async () => {
        try {
          // 3. เรียก API ใหม่ที่เราส่ง text กับ lang ไปด้วย 
          const audioData = await dashboardService.getSpeechAudio(text, lang);
          
          if (isCancelled) return; 
          
          if (!audioData || !audioData.audioContent) {
              setVisualState('idle');
              if (onSpeechEnd) onSpeechEnd();
              return;
          }

          const audioSrc = "data:audio/mp3;base64," + audioData.audioContent;
          const audio = new Audio(audioSrc);
          audioRef.current = audio;

          // 5. ผูก Event แอนิเมชันเข้ากับเสียง
          audio.onplay = () => {
               if (!isCancelled) setVisualState('talking'); // เสียงเริ่มดัง = ปากเริ่มขยับ
          };
          
          audio.onended = () => {
               if (!isCancelled) {
                   setVisualState('idle'); // เสียงจบ = ยืนพัก
                   if (onSpeechEnd) onSpeechEnd(); // แจ้งระบบว่าพูดจบแล้ว
               }
          };

          audio.onerror = () => {
              if (!isCancelled) {
                  setVisualState('idle');
                  if (onSpeechEnd) onSpeechEnd();
              }
          };

          // 6. สั่งเล่นเสียงเลย!
          if (!isCancelled) {
              audio.play().catch(e => {
                  console.error("Audio Play Error:", e);
                  // ถ้าเบราว์เซอร์บล็อกการเล่นเสียงอัตโนมัติ ให้กลับไปยืนพักและจบรอบพูด
                  if (!isCancelled) {
                      setVisualState('idle');
                      if (onSpeechEnd) onSpeechEnd();
                  }
              });
          }

        } catch (err) {
          console.error("Speech Error:", err);
          if (!isCancelled) {
              stopSpeaking();
              setVisualState('idle');
              if (onSpeechEnd) onSpeechEnd();
          }
        }
      };

      speak();
    }

    // Cleanup: เมื่อถูกสั่งให้หยุดกระทันหัน
    return () => {
        isCancelled = true; 
        stopSpeaking();
    };
    
  }, [status, text, lang, onSpeechEnd]); 

  // Render วิดีโอแอนิเมชัน (คงเดิม 100%)
  const videoStyle = { 
    width: '105%', height: '105%', position: 'absolute', 
    top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
    objectFit: 'cover', objectPosition: 'center center' 
  };
  
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: 'white', borderRadius: '5px'}}>
      <video style={{ display: visualState === 'thinking' ? 'block' : 'none', ...videoStyle }} autoPlay loop muted playsInline src="./assets/char-thinking.mp4" />
      <video style={{ display: visualState === 'talking' ? 'block' : 'none', ...videoStyle }} autoPlay loop muted playsInline src="./assets/char-talking.mp4" />
      <video style={{ display: visualState === 'idle' ? 'block' : 'none', ...videoStyle }} autoPlay loop muted playsInline src="./assets/char-idle.mp4" />
    </div>
  );
};

export default CharacterZone;