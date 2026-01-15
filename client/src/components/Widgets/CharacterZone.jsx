// OpenAI
import React, { useState, useEffect, useRef } from 'react';
import { dashboardService } from '../../api/apiClient'; 

const CharacterZone = ({ status, text, lang, onSpeechEnd }) => {
  const [visualState, setVisualState] = useState('idle'); 
  const audioRef = useRef(null);

  // Preload Videos สำหรับ Mascot
  useEffect(() => {
    ['./assets/char-thinking.mp4', './assets/char-talking.mp4', './assets/char-idle.mp4'].forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = src;
      document.head.appendChild(link);
    });
  }, []);

  const stopSpeaking = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
    }
  };

  useEffect(() => {
    // ล้างสถานะเมื่อ Mascot หยุดพูด
    if (status === 'idle') { stopSpeaking(); setVisualState('idle'); return; }
    if (status === 'thinking') { stopSpeaking(); setVisualState('thinking'); return; }

    if (status === 'talking' && text) {
      setVisualState('thinking'); 
      stopSpeaking(); 

      const speak = async () => {
        try {
          // ✅ เรียกใช้ OpenAI TTS Service แทน Gemini/Azure
          const audioBlob = await dashboardService.speakOpenAI(text, lang);

          if (!audioBlob) throw new Error("Audio generation failed");

          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audioRef.current = audio;

          // เมื่อเสียงเริ่มเล่น ให้ Mascot ขยับปาก (Talking)
          audio.onplay = () => setVisualState('talking');
          
          // เมื่อเสียงจบ ให้ Mascot กลับไปสถานะ Idle
          audio.onended = () => {
             setVisualState('idle');
             if (onSpeechEnd) onSpeechEnd();
             URL.revokeObjectURL(audioUrl); // คืนค่า Memory
          };

          audio.play().catch(e => {
              console.error("Playback Error:", e);
              setVisualState('idle');
          });

        } catch (err) {
          console.error("Speech Process Error:", err);
          setVisualState('idle');
          if (onSpeechEnd) onSpeechEnd(); 
        }
      };

      speak();
    }
    return () => stopSpeaking();
  }, [status, text, lang]); // ลบ onSpeechEnd ออกเพื่อกัน Loop ซ้อน

  const videoStyle = { 
    width: '105%', 
    height: '105%', 
    position: 'absolute', 
    top: '50%', 
    left: '50%', 
    transform: 'translate(-50%, -50%)', 
    objectFit: 'cover', 
    objectPosition: 'center center' 
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


// Google AI Studio
// import React, { useState, useEffect, useRef } from 'react';
// import { dashboardService } from '../../api/apiClient'; 

// const CharacterZone = ({ status, text, lang, onSpeechEnd }) => {
//   const [visualState, setVisualState] = useState('idle'); 
//   const audioRef = useRef(null);

//   // Preload Videos
//   useEffect(() => {
//     ['./assets/char-thinking.mp4', './assets/char-talking.mp4', './assets/char-idle.mp4'].forEach(src => {
//       const link = document.createElement('link');
//       link.rel = 'preload';
//       link.as = 'video';
//       link.href = src;
//       document.head.appendChild(link);
//     });
//   }, []);

//   const stopSpeaking = () => {
//     if (audioRef.current) {
//         audioRef.current.pause();
//         audioRef.current.currentTime = 0;
//         audioRef.current = null;
//     }
//   };

//   useEffect(() => {
//     // ป้องกันการยิง API ถ้าสถานะไม่ใช่ talking หรือไม่มี text
//     if (status !== 'talking' || !text) return;

//     let isMounted = true; // ดักจับถ้า Component ถูกปิดไปก่อนโหลดเสร็จ
//     setVisualState('thinking');

//     const speak = async () => {
//       try {
//         const audioBlob = await dashboardService.speakGeminiTTS(text, lang);
//         if (!audioBlob || !isMounted) return;

//         const audioUrl = URL.createObjectURL(audioBlob);
//         const audio = new Audio(audioUrl);
//         audioRef.current = audio;

//         audio.onplay = () => isMounted && setVisualState('talking');
//         audio.onended = () => {
//            if (isMounted) {
//              setVisualState('idle');
//              if (onSpeechEnd) onSpeechEnd();
//            }
//            URL.revokeObjectURL(audioUrl);
//         };
//         await audio.play();
//       } catch (err) {
//         if (isMounted) setVisualState('idle');
//       }
//     };

//     speak();
//     return () => { isMounted = false; stopSpeaking(); };
//   }, [status, text, lang]);

//   const videoStyle = { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, objectFit: 'cover' };
//   return (
//     <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#000', borderRadius: '24px' }}>
//       <video style={{ display: visualState === 'thinking' ? 'block' : 'none', ...videoStyle }} autoPlay loop muted playsInline src="./assets/char-thinking.mp4" />
//       <video style={{ display: visualState === 'talking' ? 'block' : 'none', ...videoStyle }} autoPlay loop muted playsInline src="./assets/char-talking.mp4" />
//       <video style={{ display: visualState === 'idle' ? 'block' : 'none', ...videoStyle }} autoPlay loop muted playsInline src="./assets/char-idle.mp4" />
//     </div>
//   );
// };

// export default CharacterZone;


// ElevenLabs
// import React, { useState, useEffect, useRef } from 'react';
// import { dashboardService } from '../../api/apiClient'; 

// const CharacterZone = ({ status, text, lang, onSpeechEnd }) => {
//   const [visualState, setVisualState] = useState('idle'); 
//   const audioRef = useRef(null);

//   // Preload Videos
//   useEffect(() => {
//     ['./assets/char-thinking.mp4', './assets/char-talking.mp4', './assets/char-idle.mp4'].forEach(src => {
//       const link = document.createElement('link');
//       link.rel = 'preload';
//       link.as = 'video';
//       link.href = src;
//       document.head.appendChild(link);
//     });
//   }, []);

//   const stopSpeaking = () => {
//     if (audioRef.current) {
//         audioRef.current.pause();
//         audioRef.current.currentTime = 0;
//         audioRef.current = null;
//     }
//   };

//   useEffect(() => {
//     if (status === 'idle') { stopSpeaking(); setVisualState('idle'); return; }
//     if (status === 'thinking') { stopSpeaking(); setVisualState('thinking'); return; }

//     if (status === 'talking' && text) {
//       setVisualState('thinking'); 
//       stopSpeaking(); 

//       const speak = async () => {
//         try {
//           // ✅ เรียกผ่าน Backend ของเราเอง
//           const audioBlob = await dashboardService.speakElevenLabs(text);

//           if (!audioBlob) throw new Error("Audio generation failed");

//           const audioUrl = URL.createObjectURL(audioBlob);
//           const audio = new Audio(audioUrl);
//           audioRef.current = audio;

//           audio.onplay = () => setVisualState('talking');
//           audio.onended = () => {
//              setVisualState('idle');
//              if (onSpeechEnd) onSpeechEnd();
//           };

//           audio.play().catch(e => {
//               console.error("Playback Error:", e);
//               setVisualState('idle');
//               if (onSpeechEnd) onSpeechEnd();
//           });

//         } catch (err) {
//           console.error("Speech Process Error:", err);
//           setVisualState('idle');
//           if (onSpeechEnd) onSpeechEnd(); 
//         }
//       };

//       speak();
//     }
//     return () => stopSpeaking();
//   }, [status, text]); 

//   const videoStyle = { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, objectFit: 'cover' };
//   return (
//     <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#000', borderRadius: '24px' }}>
//       <video style={{ display: visualState === 'thinking' ? 'block' : 'none', ...videoStyle }} autoPlay loop muted playsInline src="./assets/char-thinking.mp4" />
//       <video style={{ display: visualState === 'talking' ? 'block' : 'none', ...videoStyle }} autoPlay loop muted playsInline src="./assets/char-talking.mp4" />
//       <video style={{ display: visualState === 'idle' ? 'block' : 'none', ...videoStyle }} autoPlay loop muted playsInline src="./assets/char-idle.mp4" />
//     </div>
//   );
// };

// export default CharacterZone;



// Microsoft Azure
// import React, { useState, useEffect, useRef } from 'react';
// import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
// import { dashboardService } from '../../api/apiClient';

// const CharacterZone = ({ status, text, lang, onSpeechEnd }) => {
//   const [visualState, setVisualState] = useState('idle'); 
//   const synthesizerRef = useRef(null);
//   const playerRef = useRef(null);

//   // Preload Videos
//   useEffect(() => {
//     ['./assets/char-thinking.mp4', './assets/char-talking.mp4', './assets/char-idle.mp4'].forEach(src => {
//       const link = document.createElement('link');
//       link.rel = 'preload';
//       link.as = 'video';
//       link.href = src;
//       document.head.appendChild(link);
//     });
//   }, []);

//   const stopSpeaking = () => {
//     if (synthesizerRef.current) {
//       try { synthesizerRef.current.close(); } catch (e) {}
//       synthesizerRef.current = null;
//     }
//     if (playerRef.current) {
//          try { playerRef.current.pause(); } catch(e) {}
//     }
//   };

//   useEffect(() => {
//     if (status === 'idle') {
//       stopSpeaking();
//       setVisualState('idle');
//       return;
//     }
//     if (status === 'thinking') {
//       stopSpeaking();
//       setVisualState('thinking');
//       return;
//     }

//     if (status === 'talking' && text) {
//       setVisualState('thinking'); 
//       stopSpeaking(); 

//       const speak = async () => {
//         try {
//           const authData = await dashboardService.getSpeechToken();
//           if (!authData || !authData.token) return;

//           const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(authData.token, authData.region);
          
//           const voiceConfigs = {
//             'TH': { name: 'th-TH-PremwadeeNeural', style: 'cheerful', pitch: '+35%', rate: '-5%' },
//             'EN': { name: 'en-US-AvaNeural', style: 'cheerful', pitch: '+20%', rate: '+5%' },
//             'JP': { name: 'ja-JP-NanamiNeural', style: 'cheerful', pitch: '+10%', rate: '+5%' },
//             'CN': { name: 'zh-CN-XiaoxiaoNeural', style: 'cheerful', pitch: '+10%', rate: '+5%' },
//             'KR': { name: 'ko-KR-SunHiNeural', style: 'cheerful', pitch: '+10%', rate: '+5%' },
//             'VN': { name: 'vi-VN-HoaiMyNeural', style: 'cheerful', pitch: '+10%', rate: '+5%' }
//           };
//           const config = voiceConfigs[lang] || voiceConfigs['TH'];
//           speechConfig.speechSynthesisVoiceName = config.name;

//           const player = new sdk.SpeakerAudioDestination();
          
//           player.onAudioStart = () => {
//                setVisualState('talking'); 
//           };
          
//           player.onAudioEnd = () => {
//                setVisualState('idle');
//                if (onSpeechEnd) onSpeechEnd();
//           };
          
//           playerRef.current = player;

//           const audioConfig = sdk.AudioConfig.fromSpeakerOutput(player);
//           const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
//           synthesizerRef.current = synthesizer;

//           const ssml = `
//             <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${config.lang || 'th-TH'}">
//               <voice name="${config.name}">
//                 <mstts:express-as style="${config.style}" styledegree="2">
//                   <prosody rate="${config.rate}" pitch="${config.pitch}">${text}</prosody>
//                 </mstts:express-as>
//               </voice>
//             </speak>`;

//           synthesizer.speakSsmlAsync(
//             ssml,
//             result => {
//               if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) {
//                 stopSpeaking();
//                 setVisualState('idle');
//               }
//               synthesizer.close();
//             },
//             error => { stopSpeaking(); setVisualState('idle'); }
//           );

//         } catch (err) {
//           stopSpeaking();
//           setVisualState('idle');
//         }
//       };

//       speak();
//     }

//     return () => stopSpeaking();
    
//     // 🔥🔥🔥 จุดสำคัญที่แก้บัค: ลบ onSpeechEnd ออกจากบรรทัดข้างล่างนี้ 🔥🔥🔥
//     // เดิม: }, [status, text, lang, onSpeechEnd]);
//     // ใหม่: }, [status, text, lang]);
//   }, [status, text, lang]); 

//   // ... (ส่วน Render JSX เหมือนเดิมเป๊ะ) ...
//   const videoStyle = { 
//     width: '105%',          // กว้างเกิน 100% นิดนึงกันขอบขาว
//     height: '105%',         // สูงเกิน 100% นิดนึง
//     position: 'absolute', 
//     top: '50%',             // จัดกึ่งกลางแนวตั้ง
//     left: '50%',            // จัดกึ่งกลางแนวนอน
//     transform: 'translate(-50%, -50%)', // ดึงกลับมาให้อยู่ตรงกลางเป๊ะๆ
//     objectFit: 'cover',     // สั่งให้ขยายเต็มพื้นที่ (ยอมตัดส่วนเกินออก)
//     objectPosition: 'center center' // จัด position ของเนื้อวิดีโอ
// };
//   return (
//     <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: 'white', borderRadius: '5px'}}>
//       <video style={{ display: visualState === 'thinking' ? 'block' : 'none', ...videoStyle }} autoPlay loop muted playsInline src="./assets/char-thinking.mp4" />
//       <video style={{ display: visualState === 'talking' ? 'block' : 'none', ...videoStyle }} autoPlay loop muted playsInline src="./assets/char-talking.mp4" />
//       <video style={{ display: visualState === 'idle' ? 'block' : 'none', ...videoStyle }} autoPlay loop muted playsInline src="./assets/char-idle.mp4" />
//     </div>
//   );
// };

// export default CharacterZone;