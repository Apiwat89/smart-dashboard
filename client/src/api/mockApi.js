const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const MockApi = {
  getDashboardData: async () => {
    await delay(500); 

    return {
      user: { name: "Emma Kwan", role: "Admin", avatar: "https://i.pravatar.cc/150?img=5" },
      stats: [
        { title: "Total Patients", value: "3,256", change: "+12%", isUp: true },
        { title: "Available Staff", value: "394", change: "", isUp: true },
        { title: "Avg Treat. Costs", value: "$2,536", change: "3%", isUp: false },
        { title: "Available Cars", value: "38", change: "", isUp: true },
      ],
      charts: {
        trend: {
          title: "Outpatients vs. Inpatients Trend",
          data: [
            { name: 'Jan', uv: 2000 }, { name: 'Feb', uv: 2800 },
            { name: 'Mar', uv: 2200 }, { name: 'Apr', uv: 2900 },
            { name: 'May', uv: 2100 }, { name: 'Jun', uv: 2600 },
            { name: 'Jul', uv: 3500 },
          ]
        },
        gender: {
          title: "Patients by Gender",
          data: [
            { name: 'Female', value: 72 }, 
            { name: 'Male', value: 28 },
          ]
        }
      }
    };
  }
};