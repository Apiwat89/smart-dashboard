import React, { useState, useEffect, useRef } from 'react';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { dashboardService } from '../../api/apiClient';

const CharacterZone = ({ status, text, lang, onSpeechEnd}) => {
  const [visualState, setVisualState] = useState('idle'); 
  const synthesizerRef = useRef(null);
  const playerRef = useRef(null);

  // Preload Videos for smoother playback
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
    if (synthesizerRef.current) {
      try { synthesizerRef.current.close(); } catch (e) {}
      synthesizerRef.current = null;
    }
    if (playerRef.current) {
         try { playerRef.current.pause(); } catch(e) {}
         playerRef.current = null;
    }
  };

  useEffect(() => {
    // 1. สร้างตัวแปรเช็คสถานะ (Flag)
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
      setVisualState('thinking'); 
      stopSpeaking(); 

      const speak = async () => {
        try {
          const authData = await dashboardService.getSpeechToken();
          
          // 2. เช็คด่านแรก: ถ้าถูกยกเลิกแล้ว (เปลี่ยนภาษา/เปลี่ยนสถานะ) ให้จบเลย
          if (isCancelled) return; 
          
          if (!authData || !authData.token) return;

          const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(authData.token, authData.region);
          
          // ... (Config Voice เหมือนเดิม) ...
          const voiceConfigs = {
            'TH': { name: 'th-TH-NiwatNeural', style: 'default', pitch: '0%', rate: '-5%' },
            'EN': { name: 'en-US-DavisNeural', style: 'cheerful', pitch: '0%', rate: '+5%' },
            'JP': { name: 'ja-JP-KeitaNeural', style: 'default', pitch: '0%', rate: '+5%' },
            'CN': { name: 'zh-CN-YunxiNeural', style: 'default', pitch: '0%', rate: '+5%' },
            'KR': { name: 'ko-KR-InJoonNeural', style: 'default', pitch: '0%', rate: '+5%' },
            'VN': { name: 'vi-VN-NamMinhNeural', style: 'default', pitch: '0%', rate: '+5%' }
          };
          const config = voiceConfigs[lang] || voiceConfigs['TH'];
          speechConfig.speechSynthesisVoiceName = config.name;

          // 3. เช็คอีกทีเพื่อความชัวร์ก่อนสร้าง Player
          if (isCancelled) return;

          const player = new sdk.SpeakerAudioDestination();
          
          player.onAudioStart = () => {
               // เช็คก่อนอัปเดต State ป้องกัน Memory Leak
               if (!isCancelled) setVisualState('talking'); 
          };
          
          player.onAudioEnd = () => {
               if (!isCancelled) {
                   setVisualState('idle');
                   if (onSpeechEnd) onSpeechEnd();
               }
          };
          
          playerRef.current = player;

          const audioConfig = sdk.AudioConfig.fromSpeakerOutput(player);
          const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
          synthesizerRef.current = synthesizer;

          const ssml = `
            <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${config.lang || 'th-TH'}">
              <voice name="${config.name}">
                <mstts:express-as style="${config.style}" styledegree="2">
                  <prosody rate="${config.rate}" pitch="${config.pitch}">${text}</prosody>
                </mstts:express-as>
              </voice>
            </speak>`;

          // 4. เช็คครั้งสุดท้ายก่อนสั่งพูด
          if (isCancelled) {
              synthesizer.close();
              return;
          }

          synthesizer.speakSsmlAsync(
            ssml,
            result => {
              if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) {
                // ถ้า Error หรือ Cancel
                if (!isCancelled) {
                    stopSpeaking();
                    setVisualState('idle');
                }
              }
              synthesizer.close();
            },
            error => { 
                if (!isCancelled) {
                    stopSpeaking(); 
                    setVisualState('idle'); 
                }
            }
          );

        } catch (err) {
          if (!isCancelled) {
              stopSpeaking();
              setVisualState('idle');
          }
        }
      };

      speak();
    }

    // 5. Cleanup Function: เมื่อ Effect ถูกล้าง (เปลี่ยนภาษา/เปลี่ยน State)
    return () => {
        isCancelled = true; // สับสวิตช์บอก async function ว่า "หยุดนะ ฉันไปแล้ว"
        stopSpeaking();
    };
    
  }, [status, text, lang]); 

  // ... (ส่วน Render JSX คงเดิม) ...
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