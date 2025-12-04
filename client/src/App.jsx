import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Bell, Plus, LayoutGrid, Users, Map, FileText, Settings, User, 
  ChevronLeft, ChevronRight, Globe 
} from 'lucide-react';
import './App.css';

// Components
import VisualFactory from './components/VisualFactory'; 
import ResultBox from './components/ResultBox';
import CharacterZone from './components/CharacterZone';
import { MockApi } from './api/mockApi';
import { backendService } from './api/backendService';

function App() {
  // --- UI & Data States ---
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [currentLang, setCurrentLang] = useState('TH'); 
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  
  // --- AI States ---
  const [aiState, setAiState] = useState('idle');
  const [aiMessage, setAiMessage] = useState("");
  const [isAiMsgVisible, setIsAiMsgVisible] = useState(false); 
  const [summaryText, setSummaryText] = useState("");
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [userQuestion, setUserQuestion] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // --- Refs ---
  const widgetRefs = useRef({});
  const scrollTimeout = useRef(null);
  const scrollContainerRef = useRef(null);

  // 1. Initial Load
  useEffect(() => {
    const initDashboard = async () => {
      const data = await MockApi.getDashboardData();
      setDashboardData(data);
      setLoading(false);
      // เรียกใช้ analyzeVisibleCharts ครั้งแรกตามภาษาที่ตั้งค่าไว้
      setTimeout(() => analyzeVisibleCharts(data, currentLang), 500);
    };
    initDashboard();
  }, []);

  // 2. Timer Logic (นับถอยหลังปิดข้อความ AI)
  useEffect(() => {
    let timer;
    if (isAiMsgVisible && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (countdown === 0 && isAiMsgVisible) {
      setIsAiMsgVisible(false); setAiMessage(""); setAiState('idle');
    }
    return () => clearInterval(timer);
  }, [isAiMsgVisible, countdown]);

  // 3. ✨ NEW: Language Change Logic ✨
  // เมื่อ currentLang เปลี่ยน ให้ทำการ Analyze หน้าจอใหม่ เพื่อขอ Summary ภาษาใหม่ทันที
  useEffect(() => {
    if (!loading && dashboardData) {
        analyzeVisibleCharts(dashboardData, currentLang);
    }
  }, [currentLang]);

  // --- Handlers ---

  const handleChartClick = async (pointData, fullChartData) => {
    if (isAiProcessing) return;
    setIsAiProcessing(true); setIsAiMsgVisible(false); setAiMessage(""); setAiState('thinking');
    try {
      const reaction = await backendService.getCharacterReaction(pointData, fullChartData, currentLang);
      console.log(reaction);
      setAiMessage(reaction.message); 
      setAiState('talking'); 
      setIsAiMsgVisible(true); 
      if (reaction.isError) setCountdown(10);
      else setCountdown(100);
      setTimeout(() => setAiState('idle'), 5000); 
    } catch (err) { setAiState('idle'); } finally { setIsAiProcessing(false); }
  };

  const handleAskSomjeed = async (e) => {
    e.preventDefault();
    if (!userQuestion.trim() || isAiProcessing) return;
    setIsAiProcessing(true); setIsAiMsgVisible(false); setAiMessage(""); setAiState('thinking');
    try {
      const reaction = await backendService.getCharacterReactionInput(userQuestion, dashboardData, currentLang);
      setAiMessage(reaction.message); 
      setAiState('talking'); 
      setIsAiMsgVisible(true); 
      setUserQuestion("");
      if (reaction.isError) setCountdown(10);
      else setCountdown(100);
      setTimeout(() => setAiState('idle'), 5000); 
    } catch (err) { 
        setAiMessage("Error connecting."); setIsAiMsgVisible(true); setCountdown(5); 
    } finally { setIsAiProcessing(false); }
  };

  const handleCloseSomjeed = () => {
    setIsAiMsgVisible(false);
    setAiMessage("");
    setAiState('idle'); // ให้น้องกลับมายืนเฉยๆ
    setCountdown(0);    // เคลียร์ตัวนับเวลา
  };

  // --- Dynamic Visibility Check ---
  const analyzeVisibleCharts = async (currentData = dashboardData, lang = currentLang) => {
    if (!currentData || !scrollContainerRef.current) return;
    const visibleCharts = [];
    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();

    currentData.widgets.forEach(widget => {
        if (['area', 'doughnut', 'bar', 'line'].includes(widget.type)) {
            const el = widgetRefs.current[widget.id];
            if (el) {
                const rect = el.getBoundingClientRect();
                if (rect.top < containerRect.bottom && rect.bottom > containerRect.top) {
                    visibleCharts.push({ name: widget.title, data: widget.data });
                }
            }
        }
    });

    if (visibleCharts.length > 0) {
        setIsSummaryLoading(true);
        try {
            const aiSummary = await backendService.getDashboardSummary(visibleCharts, lang);
            setSummaryText(aiSummary);
        } catch (error) {}
        setIsSummaryLoading(false);
    }
  };

  const handleScroll = () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => analyzeVisibleCharts(dashboardData, currentLang), 1000);
  };

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh', color:'#00c49f'}}>Loading Dashboard...</div>;

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'sidebar-closed' : ''}`}>
      
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="brand-wrapper">
          <div className="brand-icon">S</div>
          <span className="brand-text">Somjeed</span>
          {!isSidebarCollapsed && (
             <button className="toggle-btn" onClick={() => setIsSidebarCollapsed(true)}>
               <ChevronLeft size={16} />
             </button>
          )}
        </div>
          {isSidebarCollapsed && (
             <button className="toggle-btn" style={{margin: '0 auto 20px auto'}} onClick={() => setIsSidebarCollapsed(false)}>
               <ChevronRight size={16} />
             </button>
          )}
        <nav style={{display:'flex', flexDirection:'column', gap:'5px', marginTop:'0'}}>
           {[
             { icon: Users, label: 'Patients' }, 
             { icon: LayoutGrid, label: 'Overview', active: true }, 
             { icon: Map, label: 'Map' }, 
             { icon: FileText, label: 'Departments' }, 
             { icon: User, label: 'Doctors' }
           ].map((item, idx) => (
             <div key={idx} className={`menu-item ${item.active ? 'active' : ''}`}>
               <item.icon size={20} /> <span className="menu-text">{item.label}</span>
             </div>
           ))}
        </nav>
      </aside>

      <header className="header">
         <div className="search-bar"><Search size={18} color="#999" /><input type="text" placeholder="Search..." style={{border:'none', outline:'none', width:'100%'}} /></div>
         <div style={{display:'flex', alignItems:'center', gap:'15px', fontWeight:'500'}}><Bell size={20} color="#666" style={{cursor:'pointer'}} /><img src={dashboardData.user.avatar} className="avatar" alt="user" /><span>{dashboardData.user.name}</span></div>
      </header>

      <main className="main-content">
        <div className="content-scroll-wrapper" ref={scrollContainerRef} onScroll={handleScroll}>
            
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px'
            }}>
                {dashboardData?.widgets
                    .filter(w => w.type === 'kpi')
                    .map(widget => (
                        <div key={widget.id} ref={el => widgetRefs.current[widget.id] = el}>
                            <VisualFactory widget={widget} onChartClick={handleChartClick} />
                        </div>
                    ))
                }
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gridAutoRows: 'minmax(300px, auto)',
                rowGap: '60px',
                columnGap: '20px',
            }}>
                {dashboardData?.widgets
                    .filter(w => w.type !== 'kpi')
                    .map(widget => (
                        <div key={widget.id} ref={el => widgetRefs.current[widget.id] = el}>
                            <VisualFactory widget={widget} onChartClick={handleChartClick} />
                        </div>
                    ))
                }
            </div>
            
            <div style={{height: '40px'}}></div>
        </div>

        <div className="fixed-bottom-summary">
            <div className={`ai-summary-wrapper ${isSummaryExpanded ? 'expanded' : 'collapsed'}`}>
                <ResultBox 
                  text={summaryText} 
                  isExpanded={isSummaryExpanded} 
                  toggleExpand={() => setIsSummaryExpanded(!isSummaryExpanded)} 
                  isLoading={isSummaryLoading} 
                  onRefresh={() => analyzeVisibleCharts(dashboardData, currentLang)}/>
            </div>
        </div>
      </main>

      <aside className="right-panel">
         <div className="char-stage">
            <CharacterZone 
              status={aiState} 
              text={aiMessage} 
              isTextVisible={isAiMsgVisible} 
              countdown={countdown} 
              
              /* ✨ ส่งฟังก์ชันนี้เข้าไป */
              onClose={handleCloseSomjeed}
            />
         </div>

         <div className="control-panel">
             <form onSubmit={handleAskSomjeed} className="ask-input-wrapper">
                <input type="text" placeholder="Ask Somjeed..." value={userQuestion} onChange={(e) => setUserQuestion(e.target.value)} disabled={isAiProcessing} />
                <button type="submit" disabled={isAiProcessing || !userQuestion} style={{display:'flex', alignItems:'center', justifyContent:'center', padding:0}}>
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                   </svg>
                </button>
             </form>
             <div className="lang-switcher-row">
                <Globe size={16} color="#666" />
                {['TH', 'EN', 'JP'].map(lang => (
                    <button 
                        key={lang} 
                        className={`lang-btn ${currentLang === lang ? 'active' : ''}`} 
                        onClick={() => setCurrentLang(lang)}
                    >
                        {lang}
                    </button>
                ))}
             </div>
         </div>
      </aside>

    </div>
  );
}

export default App;