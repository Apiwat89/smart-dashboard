import axios from 'axios';

// --- Configuration ---
const API_TIMEOUT = 30000;
const BASE_URL = '/api';

// ตั้งค่า Axios Client Instance
const client = axios.create({
  baseURL: BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Helper Functions ---

// สร้าง Header สำหรับแปะ Token ยืนยันตัวตน
const getAuthConfig = (token) => ({
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});

// ข้อความแจ้งเตือนเมื่อระบบขัดข้องตามภาษาที่เลือก
const getSystemErrorMessage = (lang) => {
  const messages = {
    TH: "แย่จัง... ระบบมีปัญหาชั่วคราวครับ",
    EN: "Oops... System is unavailable.",
    JP: "システムエラーが発生しました。",
    CN: "糟糕... 系统暂时出现问题。",
    KR: "죄송합니다... 시스템에 문제가 발생했습니다.",
    VN: "Rất tiếc... Hệ thống đang gặp sự cố.",
  };
  return messages[lang] || "System Error";
};

// --- Service Export ---

export const dashboardService = {
  // ดึง Client ID ของเครื่อง
  getClientID: async () => {
    try {
      const res = await client.get('/Client-ID');
      return res.data;
    } catch (e) {
      console.error("Fetch ClientID Error:", e);
      return null;
    }
  },

  // สรุปข้อมูล (Summarize)
  getSummary: async (charts, lang, token, pageId) => {
    try {
      const payload = { visibleCharts: charts, lang, pageId };
      const res = await client.post('/summarize-view', payload, getAuthConfig(token));
      
      return {
        message: res.data.message,
        id: res.data.id,
        usage: res.data.usage,
        input: res.data.input,
        isError: false
      };
    } catch (e) {
      return { message: getSystemErrorMessage(lang), isError: true };
    }
  },

  // ปฏิกิริยาตัวละคร (Character Reaction)
  getReaction: async (point, context, lang, token, pageId) => {
    try {
      const payload = { pointData: point, contextData: context, lang, pageId };
      const res = await client.post('/character-reaction', payload, getAuthConfig(token));
      
      return {
        message: res.data.message,
        id: res.data.id,
        usage: res.data.usage,
        input: res.data.input,
        isError: false
      };
    } catch (e) {
      return { message: getSystemErrorMessage(lang), isError: true };
    }
  },

  // ระบบแชทถาม-ตอบ (Chat AI)
  chat: async (question, allData, lang, token, pageId) => {
    try {
      const payload = { question, allData, lang, pageId };
      const res = await client.post('/ask-dashboard', payload, getAuthConfig(token));
      
      return {
        message: res.data.message,
        id: res.data.id,
        usage: res.data.usage,
        input: res.data.input,
        isError: false
      };
    } catch (e) {
      return { message: getSystemErrorMessage(lang), isError: true };
    }
  },

  // สร้างข้อความข่าววิ่ง (News Ticker)
  getNewsTicker: async (allData, lang, token, pageId) => {
    try {
      const payload = { allData, lang, pageId };
      const res = await client.post('/generate-ticker', payload, getAuthConfig(token));
      
      return {
        message: res.data.message,
        id: res.data.id,
        usage: res.data.usage,
        input: res.data.input
      };
    } catch (e) {
      return { message: "เชื่อมต่อข้อมูลระบบข่าวขัดข้อง..." };
    }
  },

  // ขอ Token สำหรับ Azure Speech Service
  // getSpeechToken: async (token) => {
  //   try {
  //     const res = await client.get('/speech-azure');
  //     return res.data;
  //   } catch (e) {
  //     console.error("Azure Token Fetch Error:", e);
  //     return null;
  //   }
  // },
  getSpeechAudio: async (text, lang) => { 
    try {
      // 1. เปลี่ยนเป็น POST และส่ง body { text, lang } ไปด้วย
      const res = await client.post('/speech-google', {
          text: text,
          lang: lang
      });
      
      // 2. สิ่งที่ได้กลับมาจะไม่ใช่ Token แล้ว แต่จะเป็น { audioContent: "base64..." }
      return res.data; 
    } catch (e) {
      console.error("Speech Audio Fetch Error:", e);
      return null;
    }
  },
  // getSpeechAudio: async (text, lang) => { 
  //   try {
  //     // ชี้ไปหาเส้นทางใหม่
  //     const res = await client.post('/speech-gemini', { 
  //         text: text,
  //         lang: lang
  //     });
  //     return res.data; 
  //   } catch (e) {
  //     console.error("Speech Audio Fetch Error:", e);
  //     return null;
  //   }
  // },

  // บันทึก Log การใช้งาน Cache (ส่งแล้วไม่ต้องรอผลตอบกลับ)
  logCacheHit: async (data) => {
    try {
      await client.post('/log-cache', data);
    } catch (e) {
      console.error("Log Cache Failed:", e);
    }
  },

  // สร้างลิงก์ QR Code สำหรับแชร์สรุป
  shareSummary: async (text) => {
    try {
      const res = await client.post('/share', { text });
      const url = `${window.location.origin}/api/view/${res.data.id}`;
      return url;
    } catch (e) {
      console.error("Share Summary Error:", e);
      throw e;
    }
  },

};