// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { InView } from 'react-intersection-observer'; // พระเอกของเรา
import axios from 'axios';
import './App.css';
import MainChart from './components/MainChart';
import ResultBox from './components/ResultBox';
import CharacterZone from './components/CharacterZone';

function App() {
  // Data Mockup (จำลองข้อมูลกราฟหลายๆ ตัว)
  const chartsData = [
    { id: 1, title: "ยอดขายรายเดือน", data: [{name: 'ม.ค.', uv: 4000}, {name: 'ก.พ.', uv: 3000}] },
    { id: 2, title: "จำนวนลูกค้าใหม่", data: [{name: 'ม.ค.', uv: 120}, {name: 'ก.พ.', uv: 200}] },
    { id: 3, title: "กำไรสุทธิ", data: [{name: 'ม.ค.', uv: 500}, {name: 'ก.พ.', uv: 1000}] },
  ];

  // State
  const [visibleChartIds, setVisibleChartIds] = useState(new Set()); // เก็บ ID กราฟที่มองเห็น
  const [summaryText, setSummaryText] = useState("กำลังรอข้อมูล...");
  const [charText, setCharText] = useState("สวัสดีครับ! ผมพร้อมทำงาน");
  const [charState, setCharState] = useState("idle");

  // --- Logic 1: จัดการ List ของกราฟที่มองเห็น ---
  const handleVisibilityChange = (inView, id) => {
    setVisibleChartIds(prev => {
      const newSet = new Set(prev);
      if (inView) newSet.add(id);
      else newSet.delete(id);
      return newSet;
    });
  };

  // --- Logic 2: ระบบ Auto-Update (Zone B) ---
  useEffect(() => {
    const interval = setInterval(async () => {
      if (visibleChartIds.size > 0) {
        // ดึงข้อมูลจริงของกราฟที่เห็นอยู่
        const currentViewData = chartsData.filter(c => visibleChartIds.has(c.id));

        console.log("Auto-Updating Zone B...", currentViewData);

        try {
          const res = await axios.post('/api/summarize-view', {
            visibleCharts: currentViewData.map(c => c.title)
          }); 
          setSummaryText(res.data.message);
        } catch (err) {
          console.error("Connect Server Error");
        }
      }
    }, 10000); // อัปเดตทุก 10 วินาที (เพื่อไม่ให้ Ollama ค้าง)

    return () => clearInterval(interval);
  }, [visibleChartIds]); // ทำงานใหม่เมื่อการมองเห็นเปลี่ยน

  // --- Logic 3: คลิกกราฟแล้วตัวการ์ตูนพูด (Zone C) ---
  const handleGraphClick = async (pointData) => {
    setCharState("thinking");
    try {
      const res = await axios.post('/api/character-reaction', {
        pointData: pointData,
        language: "TH"
      });
      setCharText(res.data.message);
      setCharState("talking");
      setTimeout(() => setCharState("idle"), 3000);
    } catch (err) {
      setCharText("ขออภัย เชื่อมต่อสมองไม่ติดครับ");
      setCharState("idle");
    }
  };

  return (
    <div className="dashboard-container">

      {/* Zone A: Scrollable Charts */}
      <div className="zone-chart" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {chartsData.map((chart) => (
          <InView key={chart.id} onChange={(inView) => handleVisibilityChange(inView, chart.id)} threshold={0.5}>
            {({ ref }) => (
              <div ref={ref} style={{ minHeight: '300px', border: '1px solid #ddd', padding: '10px', borderRadius: '10px' }}>
                <h3>{chart.title}</h3>
                {/* ส่ง props ข้อมูลลงไปในกราฟ */}
                <MainChart data={chart.data} onDataClick={handleGraphClick} />
              </div>
            )}
          </InView>
        ))}
      </div>

      {/* Zone B: Auto Summary */}
      <div className="zone-result">
        <ResultBox text={summaryText} />
      </div>

      {/* Zone C: Character */}
      <div className="zone-char">
        <CharacterZone status={charState} />
        <div style={{ marginTop: '10px', background: 'white', padding: '10px', borderRadius: '10px' }}>
           {charText}
        </div>
      </div>
    </div>
  );
}

export default App;