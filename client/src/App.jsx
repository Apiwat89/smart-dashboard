import React, { useState, useEffect } from 'react';
import { InView } from 'react-intersection-observer';
import axios from 'axios';
import './App.css';

// Import Components
import MainChart from './components/MainChart';
import ResultBox from './components/ResultBox';
import CharacterZone from './components/CharacterZone';

function App() {

  // --- 1. ข้อมูลจำลอง (Mock Data) หลายประเภท ---
  const chartsData = [
    { 
      id: 1, type: 'bar', title: "ยอดขายรายเดือน", 
      data: [{name: 'ม.ค.', uv: 4000}, {name: 'ก.พ.', uv: 3000}, {name: 'มี.ค.', uv: 2000}, {name: 'เม.ย.', uv: 2780}] 
    },
    { 
      id: 2, type: 'line', title: "Trend ผู้ใช้งาน", 
      data: [{name: 'W1', uv: 100}, {name: 'W2', uv: 200}, {name: 'W3', uv: 150}, {name: 'W4', uv: 300}, {name: 'W5', uv: 250}] 
    },
    { 
      id: 3, type: 'pie', title: "สัดส่วนสินค้า", 
      data: [{name: 'A', uv: 400}, {name: 'B', uv: 300}, {name: 'C', uv: 300}, {name: 'D', uv: 200}] 
    },
    { 
      id: 4, type: 'area', title: "กำไรสะสม", 
      data: [{name: 'Q1', uv: 1000}, {name: 'Q2', uv: 1500}, {name: 'Q3', uv: 1200}, {name: 'Q4', uv: 2000}] 
    },
    { 
      id: 5, type: 'bar', title: "ความพึงพอใจลูกค้า", 
      data: [{name: '1ดาว', uv: 10}, {name: '2ดาว', uv: 20}, {name: '3ดาว', uv: 50}, {name: '4ดาว', uv: 80}, {name: '5ดาว', uv: 120}] 
    },
    { 
      id: 6, type: 'line', title: "Traffic เว็บไซต์", 
      data: [{name: 'เช้า', uv: 500}, {name: 'สาย', uv: 1200}, {name: 'บ่าย', uv: 1500}, {name: 'เย็น', uv: 900}] 
    },
  ];

  // --- 2. State ---
  const [visibleChartIds, setVisibleChartIds] = useState(new Set());
  const [summaryText, setSummaryText] = useState("เลื่อนดูข้อมูล หรือ คลิกที่กราฟเพื่อวิเคราะห์เชิงลึก...");
  const [charText, setCharText] = useState("สวัสดีครับ! ผม Gemini พร้อมช่วยวิเคราะห์ข้อมูลครับ");
  const [charState, setCharState] = useState("idle");
  const [language, setLanguage] = useState("TH");

  // --- 3. Logic: ตรวจจับการเลื่อนหน้าจอ ---
  const handleVisibilityChange = (inView, id) => {
    setVisibleChartIds(prev => {
      const newSet = new Set(prev);
      if (inView) newSet.add(id);
      else newSet.delete(id);
      return newSet;
    });
  };

  // --- 4. Logic: Smart Auto-Update (Zone B) ---
  useEffect(() => {
    if (visibleChartIds.size === 0) return;

    const callAI = async () => {
      const currentViewData = chartsData.filter(c => visibleChartIds.has(c.id));
      // แสดง Log ว่าตอนนี้ User เห็นกราฟอะไรบ้าง
      console.log("👀 Visible Charts:", currentViewData.map(c => c.title));

      try {
        // ยิงไปที่ Server ของเรา (Port 3000)
        const res = await axios.post('api/summarize-view', { 
          visibleCharts: currentViewData.map(c => c.title) 
        });
        
        // เอาข้อความจาก AI มาใส่จริง
        setSummaryText(res.data.message); 
        
      } catch (err) {
        console.warn("Backend Error:", err);
        setSummaryText("เชื่อมต่อ Server ไม่ได้ (ตรวจสอบว่ารัน node server.js หรือยัง?)");
      }
    };

    const debounceTimer = setTimeout(() => { callAI(); }, 1500); // รอ 1.5 วิหลังหยุดเลื่อน

    return () => clearTimeout(debounceTimer);
  }, [visibleChartIds]);

  // --- 5. Logic: คลิกกราฟ (Zone C) ---
  const handleGraphClick = async (pointData, fullChartData) => {
    setCharState("thinking");
    setCharText("อืมม... ขอดูก่อนนะครับ...");
   
    try {
      const res = await axios.post('api/character-reaction', { 
        pointData: pointData,      // จุดที่จิ้ม (เช่น ยอดขาย ม.ค. 4000)
        contextData: fullChartData, // ข้อมูลเพื่อนๆ (เพื่อให้รู้ว่า 4000 นี่เยอะหรือน้อย)
        language: language 
      });

      setCharText(res.data.message);
      setCharState("talking");
      setTimeout(() => setCharState("idle"), 5000);

    } catch (err) {
      console.error("API Error:", err);
      setCharText("เชื่อมต่อสมองไม่ติดครับ");
      setCharState("idle");
    }
  };

  return (
    <div className="dashboard-container">
      {/* Zone A: กราฟ */}
      <div className="zone-chart">
        {chartsData.map((chart) => (
          <InView key={chart.id} onChange={(inView) => handleVisibilityChange(inView, chart.id)} threshold={0.5}>
            {({ ref }) => (
              <div ref={ref} className="chart-item">
                <h3>{chart.title}</h3>
                <MainChart 
                  data={chart.data} 
                  type={chart.type} 
                  // --- แก้ไขตรงนี้: ส่ง chart.data เข้าไปด้วย ---
                  onDataClick={(point) => handleGraphClick(point, chart.data)} 
                />
              </div>
            )}
          </InView>
        ))}
      </div>

      {/* Zone B: ผลลัพธ์ (Scrollable Text) */}
      <div className="zone-result">
        <ResultBox text={summaryText} />
      </div>

      {/* Zone C: ตัวการ์ตูน (No Input) */}
      <div className="zone-char">
        <CharacterZone
          currentLang={language}
          setLang={setLanguage}
          status={charState}
        />
        <div className="char-bubble-text">
           {charText}
        </div>
      </div>

    </div>
  );
}

export default App;