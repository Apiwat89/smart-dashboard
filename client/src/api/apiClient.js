import axios from 'axios';

const BASE_URL = "https://smart-dashboard-7382.onrender.com";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
});

// Helper: Error Message
const getErrorMsg = (lang) => {
    if (lang === 'TH') return "แย่จัง... ระบบมีปัญหาชั่วคราวค่ะ";
    if (lang === 'JP') return "システムエラーが発生しました。";
    if (lang === 'EN') return "Oops... System is unavailable.";
    return "System Error";
};

export const dashboardService = {
  getData: async () => {
    try {
      const res = await client.get('/dashboard-data');
      return res.data;
    } catch (e) { console.error(e); return null; }
  },

  getSummary: async (charts, lang) => {
    try {
      const res = await client.post('/summarize-view', { visibleCharts: charts, lang });
      return { message: res.data.message, isError: false };
    } catch (e) { return { message: getErrorMsg(lang), isError: true }; }
  },

  getReaction: async (point, context, lang) => {
    try {
      const res = await client.post('/character-reaction', { pointData: point, contextData: context, lang });
      return { message: res.data.message, isError: false };
    } catch (e) { return { message: getErrorMsg(lang), isError: true }; }
  },

  chat: async (question, allData, lang) => {
    try {
      const res = await client.post('/ask-dashboard', { question, allData, lang });
      return { message: res.data.message, isError: false };
    } catch (e) { return { message: getErrorMsg(lang), isError: true }; }
  }
};