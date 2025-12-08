import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import DashboardLayout from './components/Layout/DashboardLayout';
import LoadingScreen from './components/Layout/LoadingScreen';
import VisualFactory from './components/Widgets/VisualFactory';
import ResultBox from './components/Widgets/ResultBox';
import { dashboardService } from './api/apiClient';

function App() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // AI States
  const [lang, setLang] = useState('TH');
  const [aiState, setAiState] = useState({ status: 'idle', message: '', isVisible: false });
  const [isProcessing, setProcessing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [question, setQuestion] = useState("");
  
  // Summary States
  const [summary, setSummary] = useState("");
  const [isSummaryLoading, setSummaryLoading] = useState(false);
  const [isSummaryExpanded, setSummaryExpanded] = useState(false);

  // Refs
  const widgetRefs = useRef({});
  const scrollRef = useRef(null); // Ref สำหรับกล่อง Scroll
  const timeoutRef = useRef(null); // Ref สำหรับตัวจับเวลา
  const talkTimerRef = useRef(null);

  // 1. Initial Load
  useEffect(() => {
    dashboardService.getData().then(res => {
      if (res) { 
          setData(res); 
          setLoading(false); 
          // รอ 1 วิหลังโหลดเสร็จ เพื่อวิเคราะห์หน้าแรกทันที
          setTimeout(() => analyzeView(res), 1000); 
      }
    });
  }, []);

  // 2. Scroll Detection Logic 
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      // ทุกครั้งที่ขยับ ให้ล้างตัวจับเวลาเก่าทิ้ง (ยังไม่วิเคราะห์)
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      // ตั้งเวลาใหม่: ถ้าหยุดนิ่งครบ x วินาที ให้เริ่มวิเคราะห์ (analyzeView)
      timeoutRef.current = setTimeout(() => {
        analyzeView(); 
      }, 1500);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data]); // ใส่ dependency เป็น data เพื่อให้มั่นใจว่ามีข้อมูลแล้วค่อยจับ

  // Timer Logic (Character)
  useEffect(() => {
    let t;
    if (aiState.isVisible && countdown > 0) t = setInterval(() => setCountdown(c => c - 1), 1000);
    else if (countdown === 0) setAiState(p => ({ ...p, isVisible: false, status: 'idle' }));
    return () => clearInterval(t);
  }, [aiState.isVisible, countdown]);
  
  // Handlers ...
  const updateAi = (res) => {
    if (talkTimerRef.current) clearTimeout(talkTimerRef.current);
    setAiState({ status: 'talking', message: res.message, isVisible: true });
    setCountdown(res.isError ? 10 : 100);
    setProcessing(false);
    talkTimerRef.current = setTimeout(() => {
        setAiState(prev => ({
            ...prev,    // คงค่าเดิมไว้ (message, isVisible)
            status: 'idle' // เปลี่ยนแค่ท่าทางเป็นท่านิ่ง
        }));
    }, 10000);
  };

  const handleChartClick = async (point, context) => {
     if(isProcessing) return;
     setProcessing(true); 
     setAiState({ status: 'thinking', message: '', isVisible: false });
     const res = await dashboardService.getReaction(point, context, lang);
     updateAi(res);
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if(!question.trim()) return;
    setProcessing(true); 
    setAiState({ status: 'thinking', message: '', isVisible: false });
    const res = await dashboardService.chat(question, data, lang);
    setQuestion(""); 
    updateAi(res);
  };

  // Logic คำนวณว่ากราฟไหนอยู่บนจอบ้าง
  const analyzeView = async (currentData = data, currentLang = lang) => {
    if (!currentData || !scrollRef.current) return;

    // หาขอบเขตของหน้าจอที่มองเห็น (Viewport)
    const container = scrollRef.current.getBoundingClientRect();
    
    // กรองเฉพาะกราฟที่ "มองเห็น" ในหน้าจอ
    const visibleCharts = currentData.widgets
      .filter(w => ['area', 'bar', 'line', 'doughnut', 'radar', 'radial', 'composed'].includes(w.type))
      .filter(w => {
         const el = widgetRefs.current[w.id];
         if (!el) return false;
         
         const rect = el.getBoundingClientRect();
         // สูตรเช็คว่า Element อยู่ในกรอบสายตาหรือไม่
         return (
             rect.top < container.bottom - 100 && // ขอบบนกราฟ อยู่สูงกว่าขอบล่างจอ (เข้ามานิดนึง)
             rect.bottom > container.top + 100    // ขอบล่างกราฟ อยู่ต่ำกว่าขอบบนจอ
         );
      })
      .map(w => ({ name: w.title, data: w.data }));

    // ถ้าเจอกราฟในจอ ให้ส่งไป AI Summary
    if (visibleCharts.length > 0) {
       setSummaryLoading(true);
       // เรียก Service (ของจริงอาจต้องเช็คว่า visibleCharts ไม่ซ้ำกับอันเดิมเพื่อลด API Call)
       const text = await dashboardService.getSummary(visibleCharts, currentLang);
       if(text) setSummary(text.message);
       setSummaryLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
      <DashboardLayout
        user={data.user}
        isSidebarCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
        scrollRef={scrollRef} 
        
        summaryWidget={
          <div className={`ai-summary-wrapper ${isSummaryExpanded ? 'expanded' : 'collapsed'}`}>
              <ResultBox 
                  text={summary} 
                  isExpanded={isSummaryExpanded} 
                  toggleExpand={() => setSummaryExpanded(!isSummaryExpanded)}
                  isLoading={isSummaryLoading}
                  onRefresh={() => analyzeView()} 
              />
          </div>
        } 

        rightPanelProps={{
          aiState, countdown,
          closeAi: () => {
             setAiState(prev => ({ ...prev, isVisible: false, status: 'idle' }));
             if (talkTimerRef.current) clearTimeout(talkTimerRef.current);
          },
          userQuestion: question, setUserQuestion: setQuestion, handleAsk,
          currentLang: lang, setCurrentLang: setLang, isProcessing
        }}
      >
          {/* Charts Area */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              {data.widgets.filter(w => w.type === 'kpi').map(w => (
                  <VisualFactory key={w.id} widget={w} onChartClick={() => {}} />
              ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '10px' }}>
              {data.widgets.filter(w => w.type !== 'kpi').map(w => (
                  <div key={w.id} ref={el => widgetRefs.current[w.id] = el} style={{ height: '280px' }}>
                      <VisualFactory widget={w} onChartClick={handleChartClick} />
                  </div>
              ))}
          </div>

      </DashboardLayout>
    );
  }

export default App;