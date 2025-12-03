import axios from 'axios';

const BASE_URL = 'api';

export const backendService = {
  getDashboardSummary: async (chartsData) => {
    try {
      const response = await axios.post(`${BASE_URL}/summarize-view`, {
        visibleCharts: chartsData
      });
      return response.data.message;
    } catch (error) {
      // Mock response for preview if server is down
      return new Promise(resolve => setTimeout(() => resolve("**Dashboard Summary**\nBased on current data, patient volume is trending upwards by 12%."), 2000));
    }
  },

  getCharacterReaction: async (pointData, contextData) => {
    try {
      const response = await axios.post(`${BASE_URL}/character-reaction`, {
        pointData,
        contextData
      });
      return response.data.message;
    } catch (error) {
      return "Hi there! I can't reach the server right now, but that looks like an interesting data point.";
    }
  }
};