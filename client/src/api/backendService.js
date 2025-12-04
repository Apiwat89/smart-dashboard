import axios from 'axios';

const BASE_URL = 'api';

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
      if (lang == "TH") return "นักวิเคราะห์ข้อมูลไม่สามารถวิเคราะห์ข้อมูลได้ โปรดตรวจสอบระบบ"
      else if (lang == "EN") return "The data analyst is unable to process the data at the moment. Please check the system.";
      else if (lang == "JP") return "「現在、データアナリストはデータを分析できません。システムをご確認ください。」";
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
      if (lang == "TH") return "แย่จัง... ส้มจี๊ดยังไม่สามารถพร้อมช่วยเหลือในตอนนี้ได้ค่ะ โปรดเช็คระบบให้ส้มจี๊ดด้วยน่าา";
      else if (lang == "EN") return "Oops… Somjeed isn’t able to help at the moment. Please check the system for me, okay?";
      else if (lang == "JP") return "「わぁ…今はソムジードがお手伝いできないみたいです。システムを確認してくれると嬉しいです！」";
    }
  },

  getCharacterReactionInput: async (question, allData, lang = 'EN') => { 
    try {
      const response = await axios.post(`${BASE_URL}/ask-dashboard`, {
          question: question,
          allData: allData,
          lang: lang
      });
      return response.data.message
    } catch (error) {
      console.error("API Error:", error);
      if (lang == "TH") return "แย่จัง... ส้มจี๊ดยังไม่สามารถพร้อมช่วยเหลือในตอนนี้ได้ค่ะ โปรดเช็คระบบให้ส้มจี๊ดด้วยน่าา";
      else if (lang == "EN") return "Oops… Somjeed isn’t able to help at the moment. Please check the system for me, okay?";
      else if (lang == "JP") return "「わぁ…今はソムジードがお手伝いできないみたいです。システムを確認してくれると嬉しいです！」";
    }
  }
};