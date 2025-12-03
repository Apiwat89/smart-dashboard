const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const MockApi = {
  getDashboardData: async () => {
    await delay(800); // จำลองโหลดนิดนึงให้สมจริง

    return {
      user: { name: "Dr. Somchai", role: "Director", avatar: "https://i.pravatar.cc/150?img=11" },
      
      // รวม Widgets ทั้งหมด (KPI + 10 กราฟ)
      widgets: [
        // =============================================
        // ZONE 1: KPI CARDS (แสดงผลแถวบนสุด)
        // =============================================
        { 
            id: "kpi_1", type: "kpi", title: "Total Patients", 
            value: "15,234", trend: "+12.5%", status: "up" 
        },
        { 
            id: "kpi_2", type: "kpi", title: "Avg Wait Time", 
            value: "14m", trend: "-2m", status: "good" 
        },
        { 
            id: "kpi_3", type: "kpi", title: "Satisfaction", 
            value: "4.8/5", trend: "+0.1", status: "up" 
        },
        { 
            id: "kpi_4", type: "kpi", title: "Monthly Revenue", 
            value: "฿45.2M", trend: "+8%", status: "up" 
        },

        // =============================================
        // ZONE 2: CHARTS (10 กราฟ หลากหลายรูปแบบ)
        // =============================================
        
        // --- Graph 1: Area (Large) ---
        { 
          id: "chart_01", 
          type: "area", 
          size: "large", 
          title: "Yearly Patient Visits (Outpatient vs Inpatient)", 
          data: [
            { name: 'Jan', uv: 2400, pv: 2400 },
            { name: 'Feb', uv: 1398, pv: 2210 },
            { name: 'Mar', uv: 9800, pv: 2290 },
            { name: 'Apr', uv: 3908, pv: 2000 },
            { name: 'May', uv: 4800, pv: 2181 },
            { name: 'Jun', uv: 3800, pv: 2500 },
            { name: 'Jul', uv: 4300, pv: 2100 },
            { name: 'Aug', uv: 5300, pv: 2600 },
            { name: 'Sep', uv: 4100, pv: 2300 },
            { name: 'Oct', uv: 6500, pv: 2800 },
            { name: 'Nov', uv: 5900, pv: 2400 },
            { name: 'Dec', uv: 7200, pv: 3100 }
          ]
        },

        // --- Graph 2: Doughnut (Medium) ---
        { 
          id: "chart_02", 
          type: "doughnut", 
          size: "medium", 
          title: "Demographics by Gender", 
          data: [
            { name: 'Male', uv: 450 },
            { name: 'Female', uv: 550 },
            { name: 'Child', uv: 120 },
            { name: 'Elderly', uv: 300 },
          ]
        },

        // --- Graph 3: Bar (Large) ---
        { 
            id: "chart_03", 
            type: "bar", 
            size: "large", 
            title: "Top 5 Departments (Traffic Volume)", 
            data: [
              { name: 'Cardio', uv: 1200 },
              { name: 'Ortho', uv: 980 },
              { name: 'Neuro', uv: 600 },
              { name: 'Pediatric', uv: 1450 },
              { name: 'ER', uv: 2100 }
            ]
        },

        // --- Graph 4: Line (Medium) ---
        { 
            id: "chart_04", 
            type: "line", 
            size: "medium", 
            title: "Patient Satisfaction (Last 7 Days)", 
            data: [
              { name: 'Mon', uv: 4.2 },
              { name: 'Tue', uv: 4.5 },
              { name: 'Wed', uv: 4.1 },
              { name: 'Thu', uv: 4.8 },
              { name: 'Fri', uv: 4.9 },
              { name: 'Sat', uv: 4.7 },
              { name: 'Sun', uv: 4.8 }
            ]
        },

        // --- Graph 5: Bar (Medium) - ช่วงอายุคนไข้ ---
        { 
            id: "chart_05", 
            type: "bar", 
            size: "medium", 
            title: "Patient Age Groups", 
            data: [
              { name: '0-18', uv: 320 },
              { name: '19-35', uv: 450 },
              { name: '36-60', uv: 800 },
              { name: '60+', uv: 650 }
            ]
        },

        // --- Graph 6: Area (Large) - รายได้ ---
        { 
            id: "chart_06", 
            type: "area", 
            size: "large", 
            title: "Revenue Trend (Million THB)", 
            data: [
              { name: 'W1', uv: 10.5 },
              { name: 'W2', uv: 12.1 },
              { name: 'W3', uv: 9.8 },
              { name: 'W4', uv: 14.2 },
            ]
        },

        // --- Graph 7: Doughnut (Medium) - ประเภทประกัน ---
        { 
            id: "chart_07", 
            type: "doughnut", 
            size: "medium", 
            title: "Payment Methods", 
            data: [
              { name: 'Cash', uv: 30 },
              { name: 'Insurance', uv: 50 },
              { name: 'Social Sec.', uv: 20 },
            ]
        },

        // --- Graph 8: Line (Large) - ปริมาณคนไข้ ER รายชั่วโมง ---
        { 
            id: "chart_08", 
            type: "line", 
            size: "large", 
            title: "Emergency Room Traffic (24 Hours)", 
            data: [
              { name: '00:00', uv: 15 },
              { name: '04:00', uv: 8 },
              { name: '08:00', uv: 45 },
              { name: '12:00', uv: 60 },
              { name: '16:00', uv: 55 },
              { name: '20:00', uv: 90 }, // Peak ช่วงค่ำ
              { name: '23:59', uv: 30 }
            ]
        },

        // --- Graph 9: Bar (Medium) - หมอยอดฮิต ---
        { 
            id: "chart_09", 
            type: "bar", 
            size: "medium", 
            title: "Top Doctors (Cases/Month)", 
            data: [
              { name: 'Dr.A', uv: 150 },
              { name: 'Dr.B', uv: 142 },
              { name: 'Dr.C', uv: 120 },
              { name: 'Dr.D', uv: 110 }
            ]
        },

        // --- Graph 10: Area (Medium) - อัตราครองเตียง ---
        { 
            id: "chart_10", 
            type: "area", 
            size: "medium", 
            title: "Bed Occupancy Rate (%)", 
            data: [
              { name: 'Mon', uv: 75 },
              { name: 'Tue', uv: 78 },
              { name: 'Wed', uv: 82 },
              { name: 'Thu', uv: 80 },
              { name: 'Fri', uv: 88 },
              { name: 'Sat', uv: 90 },
              { name: 'Sun', uv: 85 }
            ]
        }
      ]
    };
  }
};