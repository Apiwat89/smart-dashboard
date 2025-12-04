const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const MockApi = {
  getDashboardData: async () => {
    // จำลองการโหลดข้อมูล (Loading Simulation)
    await delay(800); 

    return {
      // ข้อมูลผู้ใช้งาน (User Profile)
      user: { 
          name: "Alex Morgan", 
          role: "VP of Sales", 
          avatar: "https://i.pravatar.cc/150?img=12" 
      },
      
      widgets: [
        // =============================================
        // ZONE 1: KPI CARDS (Key Performance Indicators)
        // =============================================
        { 
            id: "kpi_1", type: "kpi", title: "Total Revenue", 
            value: "$4.2M", trend: "+12.5%", status: "up" 
        },
        { 
            id: "kpi_2", type: "kpi", title: "Net Profit", 
            value: "$840K", trend: "+5.2%", status: "up" 
        },
        { 
            id: "kpi_3", type: "kpi", title: "Active Users", 
            value: "15.4K", trend: "-2.1%", status: "down" 
        },
        { 
            id: "kpi_4", type: "kpi", title: "Conversion Rate", 
            value: "3.8%", trend: "+0.4%", status: "good" 
        },

        // =============================================
        // ZONE 2: CHARTS (With Dynamic Keys)
        // =============================================
        
        // --- Graph 1: Area (Large) - ยอดขายรายปี ---
        { 
          id: "chart_01", 
          type: "area", 
          size: "large", 
          title: "Yearly Sales Performance", 
          
          // ✨ Config: บอกว่าแกน X คือ 'month', แกน Y คือ 'total_sales'
          keys: { x: "month", y: "total_sales" },
          
          data: [
            { month: 'Jan', total_sales: 320 },
            { month: 'Feb', total_sales: 450 },
            { month: 'Mar', total_sales: 400 },
            { month: 'Apr', total_sales: 520 },
            { month: 'May', total_sales: 610 },
            { month: 'Jun', total_sales: 550 },
            { month: 'Jul', total_sales: 670 },
            { month: 'Aug', total_sales: 720 },
            { month: 'Sep', total_sales: 690 },
            { month: 'Oct', total_sales: 850 },
            { month: 'Nov', total_sales: 920 },
            { month: 'Dec', total_sales: 1100 }
          ]
        },

        // --- Graph 2: Bar (Medium) - สินค้าขายดี ---
        { 
            id: "chart_02", 
            type: "bar", 
            size: "medium", 
            title: "Top Products (Units Sold)", 
            
            keys: { x: "product_name", y: "units" }, // X=ชื่อสินค้า, Y=จำนวนชิ้น
            
            data: [
              { product_name: 'Laptop Pro', units: 1200 },
              { product_name: 'Smart Watch', units: 980 },
              { product_name: 'Headphones', units: 850 },
              { product_name: 'Camera 4K', units: 430 }
            ]
        },

        // --- Graph 3: Doughnut (Medium) - ส่วนแบ่งตลาด ---
        { 
          id: "chart_03", 
          type: "doughnut", 
          size: "medium", 
          title: "Market Share by Brand", 
          
          keys: { x: "brand", y: "share" }, // X=แบรนด์, Y=เปอร์เซ็นต์
          
          data: [
            { brand: 'Our Brand', share: 45 },
            { brand: 'Competitor A', share: 30 },
            { brand: 'Competitor B', share: 15 },
            { brand: 'Others', share: 10 },
          ]
        },

        // --- Graph 4: Line (Large) - ผู้เข้าชมเว็บไซต์ 24 ชม. ---
        { 
            id: "chart_04", 
            type: "line", 
            size: "large", 
            title: "Real-time Traffic (Visitors)", 
            
            keys: { x: "time", y: "visitors" }, // X=เวลา, Y=คนเข้าชม
            
            data: [
              { time: '06:00', visitors: 120 },
              { time: '09:00', visitors: 850 },
              { time: '12:00', visitors: 1400 },
              { time: '15:00', visitors: 1100 },
              { time: '18:00', visitors: 950 },
              { time: '21:00', visitors: 1600 }, // Peak
              { time: '00:00', visitors: 400 }
            ]
        },

        // --- Graph 5: Bar (Medium) - ยอดขายตามภูมิภาค ---
        { 
            id: "chart_05", 
            type: "bar", 
            size: "medium", 
            title: "Revenue by Region", 
            
            keys: { x: "region", y: "revenue" }, // X=ภูมิภาค, Y=รายได้
            
            data: [
              { region: 'North America', revenue: 5400 },
              { region: 'Europe', revenue: 4100 },
              { region: 'Asia Pacific', revenue: 6200 }, // สูงสุด
              { region: 'Latin America', revenue: 2300 }
            ]
        },

        // --- Graph 6: Area (Medium) - อัตรากำไร (Profit Margin) ---
        { 
            id: "chart_06", 
            type: "area", 
            size: "medium", 
            title: "Profit Margin Trend (%)", 
            
            keys: { x: "quarter", y: "margin" }, 
            
            data: [
              { quarter: 'Q1', margin: 12 },
              { quarter: 'Q2', margin: 15 },
              { quarter: 'Q3', margin: 11 }, // Drop
              { quarter: 'Q4', margin: 18 }, // Recovery
            ]
        },

        // --- Graph 7: Doughnut (Medium) - ช่องทางการขาย ---
        { 
            id: "chart_07", 
            type: "doughnut", 
            size: "medium", 
            title: "Sales Channels", 
            
            keys: { x: "channel", y: "volume" }, 
            
            data: [
              { channel: 'Online Store', volume: 60 },
              { channel: 'Retail', volume: 25 },
              { channel: 'Partners', volume: 15 },
            ]
        },
        
        // --- Graph 8: Line (Medium) - ความพึงพอใจลูกค้า ---
        { 
            id: "chart_08", 
            type: "line", 
            size: "medium", 
            title: "CSAT Score (Last 7 Days)", 
            
            keys: { x: "day", y: "score" }, 
            
            data: [
              { day: 'Mon', score: 4.2 },
              { day: 'Tue', score: 4.3 },
              { day: 'Wed', score: 4.1 },
              { day: 'Thu', score: 4.5 },
              { day: 'Fri', score: 4.8 }, // Happy Friday
              { day: 'Sat', score: 4.7 },
              { day: 'Sun', score: 4.6 }
            ]
        }
      ]
    };
  }
};