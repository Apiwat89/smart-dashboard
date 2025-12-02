import React, { useState, useEffect } from 'react';
import { InView } from 'react-intersection-observer';
import axios from 'axios';
import './App.css';

// Import Components
import MainChart from './components/MainChart';
import ResultBox from './components/ResultBox';
import CharacterZone from './components/CharacterZone';

function App() {

  // --- 1. ข้อมูลจำลอง (Mock Data) ---
  const chartsData = [
     { id: 1, type: 'bar', title: "ยอดขายรายเดือน", data: [{name: 'ม.ค.', uv: 4000}, {name: 'ก.พ.', uv: 3000}, {name: 'มี.ค.', uv: 2000}, {name: 'เม.ย.', uv: 2780}] },
     { id: 2, type: 'line', title: "Trend ผู้ใช้งาน", data: [{name: 'W1', uv: 100}, {name: 'W2', uv: 200}, {name: 'W3', uv: 150}, {name: 'W4', uv: 300}, {name: 'W5', uv: 250}] },
     { id: 3, type: 'pie', title: "สัดส่วนสินค้า", data: [{name: 'A', uv: 400}, {name: 'B', uv: 300}, {name: 'C', uv: 300}, {name: 'D', uv: 200}] },
     { id: 4, type: 'area', title: "กำไรสะสม", data: [{name: 'Q1', uv: 1000}, {name: 'Q2', uv: 1500}, {name: 'Q3', uv: 1200}, {name: 'Q4', uv: 2000}] },
     { id: 5, type: 'bar', title: "ความพึงพอใจลูกค้า", data: [{name: '1ดาว', uv: 10}, {name: '2ดาว', uv: 20}, {name: '3ดาว', uv: 50}, {name: '4ดาว', uv: 80}, {name: '5ดาว', uv: 120}] },
     { id: 6, type: 'line', title: "Traffic เว็บไซต์", data: [{name: 'เช้า', uv: 500}, {name: 'สาย', uv: 1200}, {name: 'บ่าย', uv: 1500}, {name: 'เย็น', uv: 900}] },
  ];

  // --- Config ---
  const MESSAGE_DURATION = 60000;

  // --- 2. State ---
  const [visibleChartIds, setVisibleChartIds] = useState(new Set());
  
  // State: Popup (Zone B)
  const [summaryText, setSummaryText] = useState("");
  const [isPopupExpanded, setIsPopupExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // State: Character (Zone C)
  const [charText, setCharText] = useState("");
  const [charState, setCharState] = useState("idle");
  const [language, setLanguage] = useState("TH");
  const [isCharTextVisible, setIsCharTextVisible] = useState(false); // ควบคุมการโชว์ Bubble

  // --- 3. Logic: Scroll Detection ---
  const handleVisibilityChange = (inView, id) => {
    setVisibleChartIds(prev => {
      const newSet = new Set(prev);
      if (inView) newSet.add(id);
      else newSet.delete(id);
      return newSet;
    });
    if(isPopupExpanded) setIsPopupExpanded(false);
  };

  // --- 4. Logic: Smart Auto-Update (Zone B) ---
  useEffect(() => {
    if (visibleChartIds.size === 0) return;

    const debounceTimer = setTimeout(async () => { 
        setIsProcessing(true);
        const currentViewData = chartsData.filter(c => visibleChartIds.has(c.id));
        console.log("👀 Sending to AI (View):", currentViewData.map(c => c.title));

        try {
            const res = await axios.post('api/summarize-view', { 
                visibleCharts: currentViewData.map(c => c.title) 
            });
            setSummaryText(res.data.message); 
            
            setTimeout(() => {
                setIsProcessing(false);
                setIsPopupExpanded(true); 
            }, 1500);

        } catch (err) {
            console.warn("Backend Error:", err);
            setSummaryText("เชื่อมต่อ Server ไม่ได้");
            setIsProcessing(false);
        }

    }, 1500);

    return () => clearTimeout(debounceTimer);
  }, [visibleChartIds]);

  // --- 5. Logic: Click Graph -> Character Reaction (Zone C) ---
  const handleGraphClick = async (pointData, fullChartData) => {
    // 1. เริ่มสถานะ 'ครุ่นคิด'
    setCharState("thinking");
    setIsCharTextVisible(false); // ซ่อนข้อความเก่าก่อน
    setIsPopupExpanded(false);   // หุบ Zone B ลง
   
    try {
      // 2. ยิง API ถาม
      const res = await axios.post('api/character-reaction', { 
        pointData: pointData, contextData: fullChartData, language: language 
      });

      // 3. ได้คำตอบ -> เปลี่ยนเป็น 'พูด' และโชว์ข้อความ
      setCharText(res.data.message);
      setCharState("talking");

      setTimeout(() => {
        setCharState("idle"); 
      }, 10000);

      setIsCharTextVisible(true);

      // 4. ตั้งเวลาปิดข้อความและกลับสู่ท่าปกติ
      setTimeout(() => {
        setCharState("idle");        // กลับสู่ท่าปกติ
        setIsCharTextVisible(false);  // ข้อความหายไป
      }, MESSAGE_DURATION);

    } catch (err) {
      // กรณี Error
      setCharText("เชื่อมต่อสมองไม่ติดครับ...ไพเไพเไพเ่ยไ่ำเยไ่เจ่");
      setCharState("idle");
      setIsCharTextVisible(true);
      setTimeout(() => setIsCharTextVisible(false), 10000);
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
                  onDataClick={(point) => handleGraphClick(point, chart.data)} 
                />
              </div>
            )}
          </InView>
        ))}
      </div>

      {/* Zone B: Result Popup */}
      <div 
        className={`zone-result-popup 
          ${isPopupExpanded ? 'expanded' : 'collapsed'} 
          ${(!isProcessing && summaryText && !isPopupExpanded) ? 'ready-alert' : ''} 
        `}
      >
        <ResultBox 
            text={summaryText} 
            isExpanded={isPopupExpanded}
            toggleExpand={() => setIsPopupExpanded(!isPopupExpanded)}
            isLoading={isProcessing}
        />
      </div>

      {/* Zone C: Character (Full Video Stage) */}
      <div className="zone-char">
        <CharacterZone 
          currentLang={language} 
          setLang={setLanguage} 
          status={charState} 
          text={charText}
          isTextVisible={isCharTextVisible} // ส่ง Prop ควบคุมการแสดงผล
          tailRotation="180deg"
        />
      </div>
    </div>
  );
}

export default App;