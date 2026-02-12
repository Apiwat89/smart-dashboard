import axios from 'axios';
import { getValueAsType } from 'framer-motion';

// const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ตั้งค่า Client Instance
const client = axios.create({
  baseURL: `/api`, 
  // baseURL: `${BASE_URL}/api`, 
  timeout: 30000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper: จัดการข้อความ Error ตามภาษา
const getErrorMsg = (lang) => {
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

  // ✅ 1. เพิ่มฟังก์ชันยิง Log Cache (ยิงแล้วลืม ไม่ต้องรอ return)
  logCacheHit: async (data) => {
    try {
      // data = { reqId, pageId, savedTokens, savedTime }
      await client.post('/log-cache', data);
    } catch (e) {
      console.error("Log Cache Failed:", e);
    }
  },

  // ✅ 2. ปรับแก้ให้ Return Object ตัวเต็ม (message, id, usage)
  getSummary: async (charts, lang, token, pageId) => { // รับ pageId เพิ่ม
    try {
      const res = await client.post('/summarize-view', { visibleCharts: charts, lang, pageId }, getAuthConfig(token));
      // ส่งกลับทั้งก้อน เพื่อให้ App.jsx เอาไปเก็บ Cache
      return { 
        message: res.data.message, 
        id: res.data.id, 
        usage: res.data.usage,
        input: res.data.input,
        isError: false
      };
    } catch (e) {
      return { message: getErrorMsg(lang), isError: true };
    }
  },

  // 3. ปฏิกิริยาตัวละคร (Reaction)
  getReaction: async (point, context, lang, token, pageId) => {
    try {
      const res = await client.post('/character-reaction', { pointData: point, contextData: context, lang, pageId }, getAuthConfig(token));
      return { 
        message: res.data.message,
        id: res.data.id,
        usage: res.data.usage, 
        input: res.data.input,
        isError: false 
      };
    } catch (e) {
      return { message: getErrorMsg(lang), isError: true };
    }
  },

  // 4. ถาม-ตอบ AI
  chat: async (question, allData, lang, token, pageId) => {
    try {
      const res = await client.post('/ask-dashboard', { question, allData, lang, pageId }, getAuthConfig(token));
      return { 
        message: res.data.message,
        id: res.data.id,
        usage: res.data.usage,
        input: res.data.input,
        isError: false 
      };
    } catch (e) {
      return { message: getErrorMsg(lang), isError: true };
    }
  },

  // 5. Speech Token
  speakElevenLabs: async (text, token) => {
    try {
      // ระบุ responseType: 'blob' เพื่อรับไฟล์เสียง
      const res = await client.post('/speak-eleven', { text }, { responseType: 'blob' });
      return res.data; // ส่งกลับเป็น Blob
    } catch (e) {
      console.error("Speech API Error:", e);
      return null;
    }
  },

  getSpeechToken: async (token) => {
    try {
      const res = await client.get('/speech-azure');
      return res.data;
    } catch (e) {
      console.error("Token fetch failed", e);
      return null;
    }
  },

  // 6. News Ticker
  getNewsTicker: async (allData, lang, token, pageId) => {
    try {
      const res = await client.post('/generate-ticker', { allData, lang, pageId }, getAuthConfig(token));
      return {
        message: res.data.message,
        id: res.data.id,      // รับ ID
        usage: res.data.usage, // รับ Token Usage
        input: res.data.input
      };
    } catch (e) {
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
      return `${BASE_URL}/api/view/${res.data.id}`;
    } catch (e) {
      console.error("Share Summary Error:", e);
      throw e; 
    }
  },
};