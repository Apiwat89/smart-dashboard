import React, { useState, useEffect, useRef } from 'react';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { dashboardService } from '../../api/apiClient';

const CharacterZone = ({ status, text, isTextVisible, onClose, lang, onSpeechEnd }) => {
  const synthesizerRef = useRef(null);
  const isCancelledRef = useRef(false);

  // --- Voice Configuration ---
  const VOICE_CONFIGS = {
    'TH': { lang: 'th-TH', name: 'th-TH-PremwadeeNeural', style: 'cheerful', pitch: '+20%' },
    'EN': { lang: 'en-US', name: 'en-US-AvaNeural', style: 'cheerful', pitch: '+20%' },
    'JP': { lang: 'ja-JP', name: 'ja-JP-NanamiNeural', style: 'cheerful', pitch: '+5%' },
    'CN': { lang: 'zh-CN', name: 'zh-CN-XiaoxiaoNeural', style: 'cheerful', pitch: '+10%' },
    'KR': { lang: 'ko-KR', name: 'ko-KR-SunHiNeural', style: 'cheerful', pitch: '+10%' }
  };

  const killAudio = () => {
    isCancelledRef.current = true;
    if (synthesizerRef.current) {
      try { synthesizerRef.current.close(); synthesizerRef.current = null; } catch (e) { /* ignore */ }
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  useEffect(() => {
    // Preload Videos
    ['./assets/char-thinking.mp4', './assets/char-talking.mp4', './assets/char-idle.mp4'].forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = src;
      document.head.appendChild(link);
    });
  }, []);

  useEffect(() => {
    killAudio(); // Reset on change
    if (status !== 'talking' || !text) return;

    isCancelledRef.current = false;

    const startSpeech = async () => {
      await new Promise(r => setTimeout(r, 100)); // Short delay for stability
      if (isCancelledRef.current) return;

      const authData = await dashboardService.getSpeechToken();
      if (!authData || !authData.token || isCancelledRef.current) return;

      const config = VOICE_CONFIGS[lang] || VOICE_CONFIGS['TH'];
      const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(authData.token, authData.region);
      speechConfig.speechSynthesisLanguage = config.lang;
      speechConfig.speechSynthesisVoiceName = config.name;

      const synthesizer = new sdk.SpeechSynthesizer(speechConfig, sdk.AudioConfig.fromDefaultSpeakerOutput());
      synthesizerRef.current = synthesizer;

      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${config.lang}">
          <voice name="${config.name}">
            <mstts:express-as style="${config.style}" styledegree="2">
              <prosody rate="+5%" pitch="${config.pitch}">${text}</prosody>
            </mstts:express-as>
          </voice>
        </speak>`;

      const startTime = Date.now();
      synthesizer.speakSsmlAsync(
        ssml,
        result => {
          if (isCancelledRef.current) { try { synthesizer.close(); } catch(e){} return; }
          
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
             const duration = result.audioDuration / 10000;
             const elapsed = Date.now() - startTime;
             setTimeout(() => {
                 if (!isCancelledRef.current) {
                     try { synthesizer.close(); } catch(e){}
                     if (onSpeechEnd) onSpeechEnd();
                 }
             }, Math.max(0, duration - elapsed));
          } else {
             try { synthesizer.close(); } catch(e){}
          }
        },
        error => { console.error(error); try { synthesizer.close(); } catch(e){} }
      );
    };

    startSpeech();
    return () => killAudio();
  }, [text, status, lang]);

  // Styles
  const videoStyle = { width: '100%', height: '100%', position: 'absolute' };
  const getVideoDisplay = (targetStatus) => {
    if (targetStatus === 'idle') return (status !== 'talking' && status !== 'thinking') ? 'block' : 'none';
    return status === targetStatus ? 'block' : 'none';
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#000' }}>
      <video style={{ display: getVideoDisplay('thinking'), ...videoStyle }} autoPlay loop muted playsInline src="./assets/char-thinking.mp4" />
      <video style={{ display: getVideoDisplay('talking'), ...videoStyle }} autoPlay loop muted playsInline src="./assets/char-talking.mp4" />
      <video style={{ display: getVideoDisplay('idle'), ...videoStyle }} autoPlay loop muted playsInline src="./assets/char-idle.mp4" />
    </div>
  );
};

export default CharacterZone;