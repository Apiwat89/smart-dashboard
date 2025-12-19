import axios from 'axios';

// จากโค้ด Vite ของคุณ คือลิงก์นี้ครับ:
const BASE_URL = 'https://smart-dashboard-7382.onrender.com';

const client = axios.create({
  baseURL: `${BASE_URL}/api`, // มันจะยิงไปที่ .../api/...
  timeout: 30000, // เพิ่มเวลาเผื่อ Server ปลุกตื่น (Render ฟรีจะหลับถ้าไม่มีคนใช้)
  headers: {
    'Content-Type': 'application/json',
  }
});

// Helper: Error Message
const getErrorMsg = (lang) => {
    if (lang === 'TH') return "แย่จัง... ระบบมีปัญหาชั่วคราวค่ะ";
    if (lang === 'JP') return "システムエラーが発生しました。";
    if (lang === 'EN') return "Oops... System is unavailable.";
    return "System Error";
};

export const dashboardService = {
  // 1. ดึงข้อมูลกราฟ (อาจไม่ต้องใช้ Token ถ้าเปิด Public)
  getData: async (token) => {
    try {
      const res = await client.get('/dashboard-data', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return res.data;
    } catch (e) { console.error(e); return null; }
  },

  // 2. สรุปข้อมูล
  getSummary: async (charts, lang, token) => {
    try {
      const res = await client.post('/summarize-view', 
        { visibleCharts: charts, lang },
        { headers: { Authorization: `Bearer ${token}` } } // แนบ Token
      );
      return { message: res.data.message, isError: false };
    } catch (e) { return { message: getErrorMsg(lang), isError: true }; }
  },

  // 3. ปฏิกิริยาตัวละคร
  getReaction: async (point, context, lang, token) => {
    try {
      const res = await client.post('/character-reaction', 
        { pointData: point, contextData: context, lang },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { message: res.data.message, isError: false };
    } catch (e) { return { message: getErrorMsg(lang), isError: true }; }
  },

  // 4. ถามตอบ AI
  chat: async (question, allData, lang, token) => {
    try {
      const res = await client.post('/ask-dashboard', 
        { question, allData, lang },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { message: res.data.message, isError: false };
    } catch (e) { return { message: getErrorMsg(lang), isError: true }; }
  }
};