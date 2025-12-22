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

  // 🛡️ ระบบหยุดเสียงเด็ดขาด
  const killAudio = () => {
      isCancelledRef.current = true;
      if (synthesizerRef.current) {
          try {
              synthesizerRef.current.privSynthesizer.stopSpeaking(); 
              synthesizerRef.current.close(); 
          } catch (e) {}
          synthesizerRef.current = null;
      }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
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

  // ⚡ 1. ระบบ Video Preloading (โหลดมารอไว้ใน Cache)
  useEffect(() => {
    const videoAssets = [
      './assets/char-thinking.mp4',
      './assets/char-talking.mp4',
      './assets/char-idle.mp4'
    ];
    videoAssets.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = src;
      document.head.appendChild(link);
    });
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

  // 3. Logic การพูด (แก้ไขเสียงซ้อน)
  useEffect(() => {
    killAudio(); 
    if (status !== 'talking') return;

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
        if (isCancelledRef.current) return;
        const authData = await dashboardService.getSpeechToken();
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
        if (isCancelledRef.current) { synthesizer.close(); return; }
        synthesizerRef.current = synthesizer;

        const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${currentConfig.lang}"><voice name="${currentConfig.name}"><mstts:express-as style="${currentConfig.style}" styledegree="2"><prosody rate="+5%" pitch="${currentConfig.pitch}">${text}</prosody></mstts:express-as></voice></speak>`;

        const startTime = Date.now();
        synthesizer.speakSsmlAsync(ssml, result => {
            if (isCancelledRef.current) { synthesizer.close(); return; }
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
        }, error => {
            if (!isCancelledRef.current) {
                setShowCloseButton(true);
                synthesizer.close();
                if (onSpeechEnd) onSpeechEnd();
            }
        });
    };
    startSpeech();
    return () => killAudio();
  }, [text, status, isTextVisible, lang]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#000' }}>
      {/* ⚡ แสดงวิดีโอแยกตามสถานะเพื่อลดความหน่วงตอนสลับ (Conditional Rendering) */}
      <video
        style={{ display: status === 'thinking' ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'cover', position: 'absolute' }}
        autoPlay loop muted playsInline preload="auto"
      >
        <source src="./assets/char-thinking.mp4" type="video/mp4" />
      </video>
      <video
        style={{ display: status === 'talking' ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'cover', position: 'absolute' }}
        autoPlay loop muted playsInline preload="auto"
      >
        <source src="./assets/char-talking.mp4" type="video/mp4" />
      </video>
      <video
        style={{ display: (status !== 'talking' && status !== 'thinking') ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'cover', position: 'absolute' }}
        autoPlay loop muted playsInline preload="auto"
      >
        <source src="./assets/char-idle.mp4" type="video/mp4" />
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
                    <button onClick={handleCopy} className={`bubble-action-btn copy-btn ${isCopied ? 'active' : ''}`} title="คัดลอกข้อความ">
                      <div style={{display:'flex'}}>{isCopied ? <Check size={14}/> : <Copy size={14}/>}</div>
                    </button>
                    <button onClick={handleManualClose} className="bubble-action-btn close-btn" title="ปิด">
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