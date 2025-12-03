import React, { useState, useEffect } from 'react';
import { 
  Search, Bell, Plus, LayoutGrid, Users, Map, FileText, Settings, User, Mic,
  ChevronLeft, ChevronRight 
} from 'lucide-react';
import './App.css';

// Components
import MainChart from './components/MainChart';
import ResultBox from './components/ResultBox';
import CharacterZone from './components/CharacterZone';
import { MockApi } from './api/mockApi';
import { backendService } from './api/backendService';

function App() {
  // --- UI States ---
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
  
  // --- Data States ---
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  
  // --- AI States ---
  const [aiState, setAiState] = useState('idle');
  const [aiMessage, setAiMessage] = useState("สวัสดีครับ ส้มจี๊ดพร้อมทำงานครับ!");
  const [isAiMsgVisible, setIsAiMsgVisible] = useState(true);
  const [summaryText, setSummaryText] = useState("");
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // 1. Initial Load
  useEffect(() => {
    const initDashboard = async () => {
      const data = await MockApi.getDashboardData();
      setDashboardData(data);
      setLoading(false);
      
      // ส่งข้อมูลไปให้ AI วิเคราะห์
      setIsSummaryLoading(true);
      const chartsToSend = [
          { name: "Outpatients vs Inpatients Trend", data: data.charts.trend.data },
          { name: "Patients by Gender", data: data.charts.gender.data }
      ];

      const aiSummary = await backendService.getDashboardSummary(chartsToSend);
      setSummaryText(aiSummary);
      setIsSummaryLoading(false);
    };

    initDashboard();
  }, []);

  // 2. Handle Click on Graph (Zone C)
  const handleChartClick = async (pointData, fullChartData) => {
    setAiState('thinking');
    setIsAiMsgVisible(false);

    const reaction = await backendService.getCharacterReaction(pointData, fullChartData);

    setAiMessage(reaction);
    setAiState('talking');
    setIsAiMsgVisible(true);

    setTimeout(() => setAiState('idle'), 6000);
  };

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh', color:'#00c49f'}}>Loading Dashboard...</div>;

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'sidebar-closed' : ''}`}>
      
      {/* === ZONE 1: SIDEBAR === */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="brand-wrapper">
          <div className="brand-icon">H+</div>
          <span className="brand-text">H-care</span>
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

        <button className="nav-btn" style={{
            background: 'var(--primary-green)', color:'white', border:'none', padding:'12px', 
            borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', 
            width:'100%', cursor:'pointer', fontWeight:'600'
        }}>
           <Plus size={20} /> <span className="menu-text">Register</span>
        </button>
        
        <nav style={{display:'flex', flexDirection:'column', gap:'5px', marginTop:'20px'}}>
           {[
             { icon: Users, label: 'Patients' },
             { icon: LayoutGrid, label: 'Overview', active: true },
             { icon: Map, label: 'Map' },
             { icon: FileText, label: 'Departments' },
             { icon: User, label: 'Doctors' },
           ].map((item, idx) => (
             <div key={idx} className={`menu-item ${item.active ? 'active' : ''}`}>
               <item.icon size={20} /> <span className="menu-text">{item.label}</span>
             </div>
           ))}
        </nav>
        <div className="menu-item" style={{marginTop:'auto'}}><Settings size={20}/><span className="menu-text">Settings</span></div>
      </aside>

      {/* === ZONE 2: HEADER === */}
      <header className="header">
         <div className="search-bar">
            <Search size={18} color="#999" />
            <input type="text" placeholder="Search..." style={{border:'none', outline:'none', width:'100%'}} />
         </div>
         <div style={{display:'flex', alignItems:'center', gap:'15px', fontWeight:'500'}}>
            <Bell size={20} color="#666" style={{cursor:'pointer'}} />
            <img src={dashboardData.user.avatar} className="avatar" alt="user" />
            <span>{dashboardData.user.name}</span>
         </div>
      </header>

      {/* === ZONE 3: MAIN CONTENT === */}
      <main className="main-content">
        
        {/* 3.1 Scrollable Area (Zone A) */}
        <div className="content-scroll-wrapper">
            {/* Stats */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'15px'}}>
               {dashboardData.stats.map((stat, idx) => (
                 <div className="stat-card" key={idx}>
                    <div style={{background:'#e6f7f3', padding:'10px', borderRadius:'10px', color:'#00c49f'}}><Users size={20}/></div>
                    <div>
                        <h3 style={{margin:0, fontSize:'1.4rem'}}>{stat.value}</h3>
                        <span style={{fontSize:'0.8rem', color:'#888'}}>{stat.title}</span>
                    </div>
                 </div>
               ))}
            </div>

            {/* Charts */}
            <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px', minHeight:'300px'}}>
                <div className="chart-card">
                   <div style={{display:'flex',justifyContent:'space-between', marginBottom:'10px'}}>
                      <h3>{dashboardData.charts.trend.title}</h3>
                      <select style={{border:'1px solid #ddd', borderRadius:'5px'}}><option>Monthly</option></select>
                   </div>
                   <div style={{flex:1}}>
                      <MainChart 
                        type="area" 
                        data={dashboardData.charts.trend.data} 
                        onDataClick={(point) => handleChartClick(point, dashboardData.charts.trend.data)}
                      />
                   </div>
                </div>

                <div className="chart-card">
                   <h3>{dashboardData.charts.gender.title}</h3>
                   <div style={{flex:1, position:'relative'}}>
                      <MainChart 
                        type="doughnut" 
                        data={dashboardData.charts.gender.data} 
                        onDataClick={(point) => handleChartClick(point, dashboardData.charts.gender.data)}
                      />
                   </div>
                </div>
            </div>
            <div style={{height: '20px'}}></div>
        </div>

        {/* 3.2 Collapsible Summary (Zone B) - แก้ไขใหม่ */}
        <div className="fixed-bottom-summary">
            {/* wrapper นี้จะถูกควบคุม class expanded/collapsed */}
            <div className={`ai-summary-wrapper ${isSummaryExpanded ? 'expanded' : 'collapsed'}`}>
                <ResultBox 
                    text={summaryText} 
                    isExpanded={isSummaryExpanded}
                    toggleExpand={() => setIsSummaryExpanded(!isSummaryExpanded)}
                    isLoading={isSummaryLoading} 
                />
            </div>
        </div>
      </main>

      {/* === ZONE 4: RIGHT PANEL (Character) === */}
      <aside className="right-panel">
         <div className="char-stage">
            <CharacterZone 
                status={aiState} 
                text={aiMessage} 
                isTextVisible={isAiMsgVisible}
                currentLang="EN"
                setLang={()=>{}}
            />
         </div>
         <div className="control-panel">
             <button className="action-btn" onClick={() => handleChartClick({name: 'User Ask', uv: 0}, [])}>
                <Mic size={20} /> Ask Somjeed
             </button>
         </div>
      </aside>

    </div>
  );
}

export default App;