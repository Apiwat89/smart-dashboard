import React, { useState, useEffect, useRef } from 'react';
import { dashboardService } from '../../api/apiClient'; 

const CharacterZone = ({ status, text, lang, onSpeechEnd }) => {
  const [visualState, setVisualState] = useState('idle'); 
  const audioRef = useRef(null);

  // Preload Videos
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
    if (status === 'idle') { stopSpeaking(); setVisualState('idle'); return; }
    if (status === 'thinking') { stopSpeaking(); setVisualState('thinking'); return; }

    if (status === 'talking' && text) {
      setVisualState('thinking'); 
      stopSpeaking(); 

      const speak = async () => {
        try {
          // ✅ เรียกผ่าน Backend ของเราเอง
          const audioBlob = await dashboardService.speakElevenLabs(text);

          if (!audioBlob) throw new Error("Audio generation failed");

          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audioRef.current = audio;

          audio.onplay = () => setVisualState('talking');
          audio.onended = () => {
             setVisualState('idle');
             if (onSpeechEnd) onSpeechEnd();
          };

          audio.play().catch(e => {
              console.error("Playback Error:", e);
              setVisualState('idle');
              if (onSpeechEnd) onSpeechEnd();
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
  }, [status, text]); 

  const videoStyle = { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, objectFit: 'cover' };
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#000', borderRadius: '24px' }}>
      <video style={{ display: visualState === 'thinking' ? 'block' : 'none', ...videoStyle }} autoPlay loop muted playsInline src="./assets/char-thinking.mp4" />
      <video style={{ display: visualState === 'talking' ? 'block' : 'none', ...videoStyle }} autoPlay loop muted playsInline src="./assets/char-talking.mp4" />
      <video style={{ display: visualState === 'idle' ? 'block' : 'none', ...videoStyle }} autoPlay loop muted playsInline src="./assets/char-idle.mp4" />
    </div>
  );
};

export default CharacterZone;

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
//             'KR': { name: 'ko-KR-SunHiNeural', style: 'cheerful', pitch: '+10%', rate: '+5%' }
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