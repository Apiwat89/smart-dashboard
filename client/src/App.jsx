import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import DashboardLayout from './components/Layout/DashboardLayout';
import LoadingScreen from './components/Layout/LoadingScreen';
import VisualFactory from './components/Widgets/VisualFactory';
import ResultBox from './components/Widgets/ResultBox';
import MockPowerBIEmbed from './components/Widgets/MockPowerBIEmbed'; // แบบที่ 2
import IframeWidget from './components/Widgets/IframeWidget';       // แบบที่ 3
import { dashboardService } from './api/apiClient';
import LoginPage from './components/Layout/LoginPage';

function App() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  
  // Navigation States ✨
  const [menuList, setMenuList] = useState([]);
  const [activePageId, setActivePageId] = useState(null);

  // AI & Chat States
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
  const scrollRef = useRef(null); 
  const timeoutRef = useRef(null); 
  const talkTimerRef = useRef(null);
  const powerBIContainerRef = useRef(null); 
  const powerBIReportRef = useRef(null);    

// 1. Initial Load (Data + Menu)
useEffect(() => {
  // 1.1 โหลดข้อมูลกราฟ (Internal Data)
  dashboardService.getData().then(res => {
    if (res) { 
        setData(res); 
        setLoading(false); 
    }
  });

  // 1.2 ✨ จำลองเมนูที่ได้จาก API (มีครบ 3 รูปแบบ)
  const mockMenu = [
    { 
      id: "overview", 
      title: "Internal", 
      type: "internal", 
      icon: "LayoutDashboard" 
    },
    { 
      id: "sales_pbi", 
      title: "Power BI SDK", 
      type: "powerbi", 
      icon: "BarChart" 
    },
    { 
      id: "external_web", 
      title: "Iframe", 
      type: "iframe", 
      icon: "Globe",
      url: "https://playground.powerbi.com/sampleReportEmbed" // ใส่ URL จริงตรงนี้
    }
  ];
    setMenuList(mockMenu);
    setActivePageId(mockMenu[0].id); // เปิดมาเข้าหน้าแรก
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
  const handleSpeechEnd = () => {
    setAiState(prev => ({ ...prev, status: 'idle' })); // สั่งให้หยุดขยับปาก
  };

  const updateAi = (res) => {
    if (talkTimerRef.current) clearTimeout(talkTimerRef.current);
    setAiState({ status: 'talking', message: res.message, isVisible: true });
    setCountdown(res.isError ? 10 : 100);
    setProcessing(false);
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

// ✨✨ Logic คำนวณกราฟในจอ (อัปเดตให้รองรับ Power BI) ✨✨
const analyzeView = async (currentData = data, currentLang = lang) => {
  if (!currentData || !scrollRef.current) return;

  const container = scrollRef.current.getBoundingClientRect();
  const threshold = 100;
  
  // 1. เช็คกราฟปกติ (Recharts)
  const visibleWidgets = currentData.widgets
    .filter(w => ['area', 'bar', 'line', 'doughnut', 'radar', 'radial', 'composed'].includes(w.type))
    .filter(w => {
       const el = widgetRefs.current[w.id];
       if (!el) return false;
       const rect = el.getBoundingClientRect();
       return (rect.top < container.bottom - threshold && rect.bottom > container.top + threshold);
    })
    .map(w => ({ title: w.title, data: w.data }));

  let allVisibleData = [...visibleWidgets];

  // 2. เช็คกราฟ Power BI (เพิ่มใหม่)
  if (powerBIContainerRef.current) {
      const pbiRect = powerBIContainerRef.current.getBoundingClientRect();
      // ดูว่ากล่อง Power BI เข้ามาในจอหรือยัง
      const isPbiVisible = (pbiRect.top < container.bottom - threshold && pbiRect.bottom > container.top + threshold);

      // ถ้าเห็น + มี object report ให้ดึงข้อมูลออกมา 
      if (isPbiVisible && powerBIReportRef.current) {
          try {
              const pages = await powerBIReportRef.current.getPages();
              if(pages && pages.length > 0) {
                  const visuals = await pages[0].getVisuals();
                  for (const v of visuals) {
                      // จำลองการ Export Data
                      const exportRes = await v.exportData();
                      allVisibleData.push({
                          title: `PowerBI: ${v.title}`, 
                          data: exportRes.data          
                      });
                  }
              }
          } catch (e) {
              console.error("Error extracting PowerBI data", e);
          }
      }
  }

  // ส่งข้อมูลทั้งหมดไปสรุป
  if (allVisibleData.length > 0) {
    setSummaryLoading(true);
    const text = await dashboardService.getSummary(allVisibleData, currentLang);
    if(text) setSummary(text.message);
    setSummaryLoading(false);
 }
};

  const handlePowerBIClick = (event) => {
    // แกะข้อมูลตามสูตร SDK ของจริง
    const data = event.detail.dataPoints[0];
    const regionName = data.identity[0].equals;
    const value = data.values[0].formattedValue;

    // เรียก API น้องส้มจี๊ด
    handleChartClick({ 
      name: `PowerBI: ${regionName}`, 
      uv: value 
    });
  };

  // ✨ ฟังก์ชันเลือกเนื้อหาที่จะแสดงตรงกลาง
  const renderContent = () => {
    const currentPage = menuList.find(p => p.id === activePageId);
    if (!currentPage) return null;

    // --- แบบที่ 1: Internal (Recharts) --- (อันนี้เหมือนเดิม ไม่ต้องแก้)
    if (currentPage.type === 'internal') {
      return (
        <div className="fade-in">
          <h2 style={{ marginBottom: '20px' }}>{currentPage.title}</h2>
          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              {data && data.widgets.filter(w => w.type === 'kpi').map(w => (
                  <VisualFactory key={w.id} widget={w} onChartClick={() => {}} />
              ))}
          </div>
          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {data && data.widgets.filter(w => w.type !== 'kpi').map(w => (
                  <div key={w.id} ref={el => widgetRefs.current[w.id] = el} style={{ height: '280px' }}>
                      <VisualFactory widget={w} onChartClick={handleChartClick} />
                  </div>
              ))}
          </div>
        </div>
      );
    }

    // --- แบบที่ 2: Power BI SDK --- (✨ แก้ตรง style height)
    if (currentPage.type === 'powerbi') {
      return (
        <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginBottom: '15px' }}>📊 {currentPage.title}</h2>
            {/* เปลี่ยนจาก minHeight 600px เป็น height: 'calc(100vh - 180px)' เพื่อให้ยืดเต็มจอ */}
            <div ref={powerBIContainerRef} style={{ flex: 1, height: 'calc(100vh - 180px)', minHeight: '600px' }}>
              <MockPowerBIEmbed 
                  eventHandlers={new Map([['dataSelected', handlePowerBIClick]])}
                  getEmbeddedComponent={(report) => { powerBIReportRef.current = report; }}
              />
            </div>
        </div>
      );
    }

    // --- แบบที่ 3: Iframe --- (✨ แก้ตรง style height)
    if (currentPage.type === 'iframe') {
      return (
        <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginBottom: '15px' }}>🌐 {currentPage.title}</h2>
            {/* สั่งให้สูงเต็มจอ ลบ Header/Padding ออกนิดหน่อย (180px) */}
            <div style={{ flex: 1, height: 'calc(100vh - 180px)', minHeight: '600px' }}>
              <IframeWidget url={currentPage.url} title={currentPage.title} />
            </div>
        </div>
      );
    }
  };

  if (loading) return <LoadingScreen />;
  if (!user) {
    return <LoginPage onLogin={(userData) => setUser(userData)} />;
  }

  return (
    <DashboardLayout
      user={user} // ใส่ ? กัน error กรณี data ยังไม่มา
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
        currentLang: lang, setCurrentLang: setLang, isProcessing,
        onSpeechEnd: handleSpeechEnd,
      }}
      
      // ✨ Props สำหรับเมนู (ถูกต้องแล้ว)
      menuItems={menuList}
      activePageId={activePageId}
      onMenuClick={(id) => setActivePageId(id)}
    >
        
        {/* ✅✅✅ แก้ตรงนี้: เหลือแค่บรรทัดนี้บรรทัดเดียวพอครับ ✅✅✅ */}
        {renderContent()}

        {/* ❌ ลบโค้ดด้านล่างนี้ทิ้งทั้งหมด (Charts Area, VisualFactory loop, Power BI Test) 
           เพราะเราย้าย logic ไปอยู่ใน renderContent() หมดแล้วครับ
           ไม่งั้นมันจะโชว์ซ้ำซ้อน
        */}

    </DashboardLayout>
  );
}

export default App;