import axios from 'axios';

const BASE_URL = "https://smart-dashboard-7382.onrender.com";

// ตั้งค่า Client Instance
const client = axios.create({
  baseURL: `${BASE_URL}/api`, // หรือ `${BASE_URL}/api` ตาม Environment
  timeout: 30000, // เพิ่ม Timeout ป้องกัน Server (Render) หลับ
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper: จัดการข้อความ Error ตามภาษา
const getErrorMsg = (lang) => {
  const messages = {
    TH: "แย่จัง... ระบบมีปัญหาชั่วคราวค่ะ",
    EN: "Oops... System is unavailable.",
    JP: "システムエラーが発生しました。",
    CN: "糟糕... 系统暂时出现问题。",       // จีน
    KR: "죄송합니다... 시스템에 문제가 발생했습니다.", // เกาหลี
    VN: "Rất tiếc... Hệ thống đang gặp sự cố.",    // เวียดนาม
  };
  return messages[lang] || "System Error";
};

// Helper: สร้าง Config สำหรับ Request
const getAuthConfig = (token) => ({
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});

export const dashboardService = {

  // ดึง Report 
  getClientID: async () => {
    try {
      const res = await client.get('/Client-ID');
      return res.data;
    } catch (e) {
      console.log("Fetch Data Error:", e);
      return null;
    }
  },

  // 1. ดึงข้อมูล Dashboard
  getData: async (token) => {
    try {
      const res = await client.get('/dashboard-data', getAuthConfig(token));
      return res.data;
    } catch (e) {
      console.error("Fetch Data Error:", e);
      return null;
    }
  },

  // 2. สรุปข้อมูล (Summarize)
  getSummary: async (charts, lang, token) => {
    try {
      const res = await client.post('/summarize-view', { visibleCharts: charts, lang }, getAuthConfig(token));
      return { message: res.data.message, isError: false };
    } catch (e) {
      return { message: getErrorMsg(lang), isError: true };
    }
  },

  // 3. ปฏิกิริยาตัวละคร (Reaction)
  getReaction: async (point, context, lang, token) => {
    try {
      const res = await client.post('/character-reaction', { pointData: point, contextData: context, lang }, getAuthConfig(token));
      return { message: res.data.message, isError: false };
    } catch (e) {
      return { message: getErrorMsg(lang), isError: true };
    }
  },

  // 4. ถาม-ตอบ AI
  chat: async (question, allData, lang, token) => {
    try {
      const res = await client.post('/ask-dashboard', { question, allData, lang }, getAuthConfig(token));
      return { message: res.data.message, isError: false };
    } catch (e) {
      return { message: getErrorMsg(lang), isError: true };
    }
  },

  // 5. Speech Token
  // OpenAI
  // speakOpenAI: async (text, lang) => {
  //   try {
  //     // ⏳ ไม้ตาย: หน่วงเวลา 1.2 วินาที เพื่อหลบ API Data/Summary/Ticker 
  //     // ที่ยิงรัวตอนเปิดหน้าเว็บครั้งแรก
  //     await new Promise(r => setTimeout(r, 1200));

  //     const res = await client.post('/speak-openai', { text, lang }, { responseType: 'blob' });
  //     return res.data; 
  //   } catch (e) {
  //     console.error("OpenAI TTS API Error:", e);
  //     return null;
  //   }
  // },

  // Google AI Studio
  // speakGeminiTTS: async (text, lang, retryCount = 0) => {
  //   try {
  //     // ⏳ จังหวะโหลดหน้าแรก (retryCount 0) ให้รอไปเลย 4 วินาที 
  //     // เพื่อให้มั่นใจว่า API อื่นๆ ที่ยิงตอนเปลี่ยนหน้าโหลดเสร็จหมดแล้ว
  //     if (retryCount === 0) {
  //         console.log("🔊 TTS Waiting for other APIs to settle...");
  //         await new Promise(r => setTimeout(r, 4000)); 
  //     }

  //     const res = await client.post('/speak-google', { text, lang }, { responseType: 'blob' });
  //     return res.data; 

  //   } catch (e) {
  //     // 🚩 หากยังล้มเหลว (เช่น Error 500 หรือ Timeout) ให้รออีก 5 วินาทีก่อนลองใหม่
  //     if (retryCount < 2) {
  //       console.warn(`🔊 TTS Busy (Attempt ${retryCount + 1}), waiting longer before retry...`);
  //       await new Promise(resolve => setTimeout(resolve, 5000));
  //       return dashboardService.speakGeminiTTS(text, lang, retryCount + 1);
  //     }
  //     console.error("❌ Gemini TTS API Final Error:", e);
  //     return null;
  //   }
  // },

  // ElevenLabs have 2 choice 
  // speakElevenLabs: async (text, lang) => {
  //   // 1. ใส่ Key ของคุณตรงนี้ (Hardcode ไปเลยเพื่อความชัวร์ในฝั่ง Client)
  //   const API_KEY = "sk_b5cb52c198e6029f8c62060ac5b3cf9baf95084653018b92"; 

  //   // 2. กำหนด Voice ID (Mapping)
  //   const VOICE_MAP = {
  //       'TH': 'B8gJV1IhpuegLxdpXFOE', // เสียงไทย (หรือเสียงที่คุณเลือก)
  //       'JP': 'B8gJV1IhpuegLxdpXFOE',
  //       'EN': '...ID_เสียงฝรั่ง...', 
  //       'CN': '...ID_เสียงจีน...',
  //       'default': 'B8gJV1IhpuegLxdpXFOE'
  //   };
  //   const selectedVoiceId = VOICE_MAP[lang] || VOICE_MAP['default'];

  //   try {
  //     console.log(`🔊 Client กำลังขอเสียงจาก ElevenLabs (${lang})...`);
      
  //     const response = await axios({
  //       method: 'post',
  //       url: `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
  //       headers: {
  //         'Accept': 'audio/mpeg',
  //         'xi-api-key': API_KEY, // ส่ง Key จาก Browser
  //         'Content-Type': 'application/json'
  //       },
  //       data: {
  //         text: text,
  //         model_id: "eleven_v3", // ใช้ v3 หรือ eleven_multilingual_v2
  //         voice_settings: { stability: 0.5, similarity_boost: 0.75 }
  //       },
  //       responseType: 'blob' // 👈 สำคัญ: รับเป็น Blob (ไฟล์เสียง) โดยตรง
  //     });

  //     return response.data; // ส่ง Blob กลับไปให้ CharacterZone เล่น

  //   } catch (e) {
  //     console.error("❌ ElevenLabs Client Error:", e);
  //     return null;
  //   }
  // },
  // speakElevenLabs: async (text) => {
  //   try {
  //     // ระบุ responseType: 'blob' เพื่อรับไฟล์เสียง
  //     const res = await client.post('/speak-eleven', { text }, { responseType: 'blob' });
  //     return res.data; // ส่งกลับเป็น Blob
  //   } catch (e) {
  //     console.error("Speech API Error:", e);
  //     return null;
  //   }
  // },

  // Microsoft Azure
  getSpeechToken: async () => {
    try {
      const res = await client.get('/get-speech-token');
      return res.data;
    } catch (e) {
      console.error("Token fetch failed", e);
      return null;
    }
  },

  // 6. News Ticker
  getNewsTicker: async (allData, lang, token) => {
    try {
      const res = await client.post('/generate-ticker', { allData, lang }, getAuthConfig(token));
      return res.data;
    } catch (e) {
      console.error("Ticker API Error", e);
      return { message: "เชื่อมต่อข้อมูลระบบข่าวขัดข้อง..." };
    }
  },

  // ✨ 7. สร้างลิงก์ QR Code (แก้ URL ให้ถูกต้อง)
  shareSummary: async (text) => {
    try {
      // ยิงไปที่ /share (axios config มี baseURL: /api อยู่แล้ว -> กลายเป็น /api/share)
      const res = await client.post('/share', { text });
      
      // ⚠️ แก้ตรงนี้: เพิ่ม /api เข้าไปในลิงก์ผลลัพธ์
      // เพราะ Route view ตอนนี้คือ /api/view/:id
      return `${BASE_URL}/view/${res.data.id}`;
    } catch (e) {
      console.error("Share Summary Error:", e);
      throw e; 
    }
  },
};