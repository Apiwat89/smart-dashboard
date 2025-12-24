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

  const [isSpeakingInternal, setIsSpeakingInternal] = useState(false);

  const killAudio = () => {
    isCancelledRef.current = true;
    setIsSpeakingInternal(false); // ปลดสถานะการทำงาน

    if (synthesizerRef.current) {
        try {
            // สั่งหยุดทันทีและปิดทรัพยากร
            synthesizerRef.current.close(); 
            synthesizerRef.current = null;
        } catch (e) {
            console.error("Error closing synthesizer:", e);
        }
    }
    // เคลียร์เสียงของ Browser พื้นฐานด้วย
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

  const videoStyle = {
    width: '100%',
    height: '100%',
    position: 'absolute'
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
    // ทุกครั้งที่ข้อความหรือสถานะเปลี่ยน ให้หยุดเสียงเก่าก่อนทันที
    killAudio(); 

    if (status !== 'talking' || !text) return;

    isCancelledRef.current = false;
    setShowCloseButton(false);

    const startSpeech = async () => {
        // หน่วงเวลาเล็กน้อย (100ms) เพื่อให้ทรัพยากรเก่าถูกทำลายทิ้งจริง ๆ
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (isCancelledRef.current) return;

        const authData = await dashboardService.getSpeechToken();
        if (isCancelledRef.current || !authData || !authData.token) {
            setShowCloseButton(true);
            return;
        }

        const voiceConfigs = {
            'TH': { lang: 'th-TH', name: 'th-TH-PremwadeeNeural', style: 'cheerful', pitch: '+20%' },
            'EN': { lang: 'en-US', name: 'en-US-AvaNeural', style: 'cheerful', pitch: '+20%' },
            'JP': { lang: 'ja-JP', name: 'ja-JP-NanamiNeural', style: 'cheerful', pitch: '+5%' },
            'CN': { lang: 'zh-CN', name: 'zh-CN-XiaoxiaoNeural', style: 'cheerful', pitch: '+10%' },
            'KR': { lang: 'ko-KR', name: 'ko-KR-SunHiNeural', style: 'cheerful', pitch: '+10%' }
        };
        const currentConfig = voiceConfigs[lang] || voiceConfigs['TH'];

        const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(authData.token, authData.region);
        speechConfig.speechSynthesisLanguage = currentConfig.lang;
        speechConfig.speechSynthesisVoiceName = currentConfig.name;
        
        const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
        
        if (isCancelledRef.current) {
            synthesizer.close();
            return;
        }
        
        synthesizerRef.current = synthesizer;
        setIsSpeakingInternal(true);

        const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${currentConfig.lang}"><voice name="${currentConfig.name}"><mstts:express-as style="${currentConfig.style}" styledegree="2"><prosody rate="+5%" pitch="${currentConfig.pitch}">${text}</prosody></mstts:express-as></voice></speak>`;

        const startTime = Date.now();
        
        synthesizer.speakSsmlAsync(
            ssml,
            result => {
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
                            setIsSpeakingInternal(false);
                            synthesizer.close();
                            synthesizerRef.current = null;
                            if (onSpeechEnd) onSpeechEnd();
                        }
                    }, remainingTime);
                } else {
                    synthesizer.close();
                    setIsSpeakingInternal(false);
                    if (!isCancelledRef.current) setShowCloseButton(true);
                }
            },
            error => {
                console.error("Speech Error:", error);
                synthesizer.close();
                setIsSpeakingInternal(false);
                if (!isCancelledRef.current) setShowCloseButton(true);
            }
        );
    };

    startSpeech();
    
    // Cleanup function เมื่อ Component Unmount หรือ dependencies เปลี่ยน
    return () => killAudio();
  }, [text, status, lang]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#000' }}>
      {/* แสดงเฉพาะตัววิดีโอ Mascot เท่านั้น */}
      <video style={{ display: status === 'thinking' ? 'block' : 'none', ...videoStyle }} autoPlay loop muted playsInline>
        <source src="./assets/char-thinking.mp4" type="video/mp4" />
      </video>
      <video style={{ display: status === 'talking' ? 'block' : 'none', ...videoStyle }} autoPlay loop muted playsInline>
        <source src="./assets/char-talking.mp4" type="video/mp4" />
      </video>
      <video style={{ display: (status !== 'talking' && status !== 'thinking') ? 'block' : 'none', ...videoStyle }} autoPlay loop muted playsInline>
        <source src="./assets/char-idle.mp4" type="video/mp4" />
      </video>

      {/* ❌ ลบส่วน isTextVisible && ( <div className="char-floating-bubble"> ... ) ออก */}
    </div>
  );
};

export default CharacterZone;