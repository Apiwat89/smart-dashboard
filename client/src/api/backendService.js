import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api'; // ตรวจสอบ Port ให้ตรงกับ Server

export const backendService = {
  // เพิ่ม parameter 'lang'
  getDashboardSummary: async (chartsData, lang = 'EN') => {
    try {
      const response = await axios.post(`${BASE_URL}/summarize-view`, {
        visibleCharts: chartsData,
        lang: lang
      });
      return response.data.message;
    } catch (error) {
      console.error("API Error:", error);
      return "System is currently unavailable.";
    }
  },

  getCharacterReaction: async (pointData, contextData, lang = 'EN') => {
    try {
      const response = await axios.post(`${BASE_URL}/character-reaction`, {
        pointData,
        contextData,
        lang: lang
      });
      return response.data.message;
    } catch (error) {
      console.error("API Error:", error);
      return "Cannot connect to AI.";
    }
  },

  getCharacterReactionInput: async (question, allData, lang = 'EN') => { 
    try {
      const response = await axios.post(`${BASE_URL}/ask-dashboard`, {
          question: question,
          allData: allData,
          lang: lang
      });
      return response.data.message;
    } catch (error) {
      console.error("API Error:", error);
      return "Cannot connect to AI.";
    }
  }
};