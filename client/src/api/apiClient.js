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
    JP: "システムエラーが発生しました。",
    EN: "Oops... System is unavailable.",
  };
  return messages[lang] || "System Error";
};

// Helper: สร้าง Config สำหรับ Request
const getAuthConfig = (token) => ({
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});

export const dashboardService = {
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
  speakElevenLabs: async (text, lang) => {
    // 1. ใส่ Key ของคุณตรงนี้ (Hardcode ไปเลยเพื่อความชัวร์ในฝั่ง Client)
    const API_KEY = "sk_f9ec2e6dd4e00b86728af8ecb7bf41ca1abb031759c18b3a"; 

    // 2. กำหนด Voice ID (Mapping)
    const VOICE_MAP = {
        'TH': 'B8gJV1IhpuegLxdpXFOE', // เสียงไทย (หรือเสียงที่คุณเลือก)
        'JP': 'B8gJV1IhpuegLxdpXFOE',
        'EN': '...ID_เสียงฝรั่ง...', 
        'CN': '...ID_เสียงจีน...',
        'default': 'B8gJV1IhpuegLxdpXFOE'
    };
    const selectedVoiceId = VOICE_MAP[lang] || VOICE_MAP['default'];

    try {
      console.log(`🔊 Client กำลังขอเสียงจาก ElevenLabs (${lang})...`);
      
      const response = await axios({
        method: 'post',
        url: `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': API_KEY, // ส่ง Key จาก Browser
          'Content-Type': 'application/json'
        },
        data: {
          text: text,
          model_id: "eleven_v3", // ใช้ v3 หรือ eleven_multilingual_v2
          voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        },
        responseType: 'blob' // 👈 สำคัญ: รับเป็น Blob (ไฟล์เสียง) โดยตรง
      });

      return response.data; // ส่ง Blob กลับไปให้ CharacterZone เล่น

    } catch (e) {
      console.error("❌ ElevenLabs Client Error:", e);
      return null;
    }
  },
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
  // getSpeechToken: async () => {
  //   try {
  //     const res = await client.get('/get-speech-token');
  //     return res.data;
  //   } catch (e) {
  //     console.error("Token fetch failed", e);
  //     return null;
  //   }
  // },

  // 6. News Ticker
  getNewsTicker: async (allData, pageTitle, lang, token) => {
    try {
      const res = await client.post('/generate-ticker', { allData, pageTitle, lang }, getAuthConfig(token));
      return res.data;
    } catch (e) {
      console.error("Ticker API Error", e);
      return { message: "เชื่อมต่อข้อมูลระบบข่าวขัดข้อง..." };
    }
  },
};