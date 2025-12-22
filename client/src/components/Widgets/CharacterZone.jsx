import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Check } from 'lucide-react'; 
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { dashboardService } from '../../api/apiClient';

const CharacterZone = ({ status, text, isTextVisible, countdown, onClose, lang, onSpeechEnd }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [showCloseButton, setShowCloseButton] = useState(false); 
  const [isCopied, setIsCopied] = useState(false); 
  
  const synthesizerRef = useRef(null);
  const isCancelledRef = useRef(false);

  // 🛡️ ฟังก์ชันหยุดเสียงที่บังคับตัดการทำงานทุกระดับ
  const killAudio = () => {
      isCancelledRef.current = true; // บล็อก Flag ทั้งหมดทันที
      
      if (synthesizerRef.current) {
          try {
              // บังคับหยุดการส่งข้อมูลเสียงไปยัง Speaker ทันที
              synthesizerRef.current.close(); 
          } catch (e) {
              // console.log("Synthesizer already cleaned up");
          }
          synthesizerRef.current = null;
      }

      // ล้างเสียงค้างของ Web Speech API (ถ้ามีหลงเหลือ)
      if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
      }
  };

  const handleManualClose = () => {
      killAudio(); 
      if (onClose) onClose();
  };

  const handleCopy = () => {
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
      });
  };

  // 1. Effect สำหรับพิมพ์ดีด
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

  // 2. Logic การพูด (แก้ไขเพื่อตัดปัญหาเสียงทับซ้อนถาวร)
  useEffect(() => {
    // 🛑 กฏข้อแรก: ทันทีที่ useEffect รัน (Text เปลี่ยน) ต้องฆ่าเสียงเก่าทิ้งทันที
    killAudio(); 

    if (status !== 'talking') return;

    // เริ่มต้นสถานะใหม่สำหรับข้อความนี้
    isCancelledRef.current = false;
    setShowCloseButton(false);

    if (!isTextVisible || !text) {
        const fakeDuration = 2000;
        const t = setTimeout(() => { 
            if (!isCancelledRef.current) {
                setShowCloseButton(true);
                if (onSpeechEnd) onSpeechEnd();
            }
        }, fakeDuration);
        return () => {
            isCancelledRef.current = true;
            clearTimeout(t);
        };
    }

    const startSpeech = async () => {
        // 🛡️ เช็คก่อนดึง Token
        if (isCancelledRef.current) return;

        const authData = await dashboardService.getSpeechToken();
        
        // 🛡️ เช็คหลังดึง Token (เพราะ Async ใช้เวลา เพื่อนอาจกดย้ำรัวๆ ในช่วงนี้)
        if (isCancelledRef.current || !authData || !authData.token) {
            if (!authData) setShowCloseButton(true);
            return;
        }

        const voiceConfigs = {
            'TH': { lang: 'th-TH', name: 'th-TH-PremwadeeNeural', style: 'cheerful', pitch: '+20%' },
            'EN': { lang: 'en-US', name: 'en-US-AvaNeural', style: 'cheerful', pitch: '+20%' },
            'JP': { lang: 'ja-JP', name: 'ja-JP-NanamiNeural', style: 'cheerful', pitch: '+5%' }
        };
        const currentConfig = voiceConfigs[lang] || voiceConfigs['TH'];

        const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(authData.token, authData.region);
        speechConfig.speechSynthesisLanguage = currentConfig.lang;
        speechConfig.speechSynthesisVoiceName = currentConfig.name;
        
        const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
        
        // 🛡️ ก่อนจะพูดจริง เช็คอีกรอบว่าโดนยกเลิกไปหรือยัง
        if (isCancelledRef.current) {
            synthesizer.close();
            return;
        }
        
        synthesizerRef.current = synthesizer;

        const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${currentConfig.lang}"><voice name="${currentConfig.name}"><mstts:express-as style="${currentConfig.style}" styledegree="2"><prosody rate="+5%" pitch="${currentConfig.pitch}">${text}</prosody></mstts:express-as></voice></speak>`;

        const startTime = Date.now();

        synthesizer.speakSsmlAsync(
            ssml,
            result => {
                // 🛡️ ป้องกัน Callback จากรอบเก่าทำงานทับรอบใหม่
                if (isCancelledRef.current) {
                    synthesizer.close();
                    return; 
                }
                
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    const audioDurationMs = result.audioDuration / 10000;
                    const elapsedTime = Date.now() - startTime;
                    const remainingTime = Math.max(0, audioDurationMs - elapsedTime);

                    setTimeout(() => {
                        if (!isCancelledRef.current) {
                            setShowCloseButton(true);
                            synthesizer.close();
                            synthesizerRef.current = null;
                            if (onSpeechEnd) onSpeechEnd();
                        }
                    }, remainingTime);
                } else {
                    if (!isCancelledRef.current) {
                      setShowCloseButton(true);
                      synthesizer.close();
                      if (onSpeechEnd) onSpeechEnd();
                    }
                }
            },
            error => {
                if (!isCancelledRef.current) {
                    console.error("Azure Speech Error:", error);
                    setShowCloseButton(true);
                    synthesizer.close();
                    if (onSpeechEnd) onSpeechEnd();
                }
            }
        );
    };

    startSpeech();

    return () => killAudio();
  }, [text, status, isTextVisible, lang]); // 🔄 Dependency 'text' จะทำให้เสียงเก่าดับทันทีที่คำถามใหม่ถูกส่งไป

  const getVideoSource = () => {
    const map = { thinking: './assets/char-thinking.mp4', talking: './assets/char-talking.mp4', idle: './assets/char-idle.mp4' };
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
           
           <div className="bubble-timer" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {showCloseButton && (
                  <>
                    <button 
                      onClick={handleCopy} 
                      className={`bubble-action-btn copy-btn ${isCopied ? 'active' : ''}`}
                      title="คัดลอกข้อความ"
                    >
                      <div style={{display:'flex'}}>
                        {isCopied ? <Check size={14}/> : <Copy size={14}/>}
                      </div>
                    </button>
                    <button 
                      onClick={handleManualClose} 
                      className="bubble-action-btn close-btn" 
                      title="ปิด"
                    >
                      <div style={{display:'flex'}}><X size={14}/></div>
                    </button>
                  </>
                )}
              </div>
              <span className={`timer-text ${isCopied ? 'copied' : ''}`}>
                 {isCopied ? "คัดลอกแล้ว!" : `ปิดอัตโนมัติใน ${countdown}s`}
              </span> 
           </div>
        </div>
      )}
    </div>
  );
};

export default CharacterZone;