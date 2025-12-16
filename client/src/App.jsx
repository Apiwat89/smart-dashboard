import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { models } from 'powerbi-client'; 

// Auth
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "./authConfig";

// Layouts & Widgets
import DashboardLayout from './components/Layout/DashboardLayout';
import LoadingScreen from './components/Layout/LoadingScreen';
import RealPowerBIEmbed from './components/Widgets/RealPowerBIEmbed'; 
import ResultBox from './components/Widgets/ResultBox';
import LoginPage from './components/Layout/LoginPage';

// API
import { dashboardService } from './api/apiClient';

function App() {
  // Auth State
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const [isAppReady, setAppReady] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);

  // App State
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [menuList, setMenuList] = useState([]);
  const [activePageId, setActivePageId] = useState("page_overview");

  // AI State
  const [lang, setLang] = useState('TH');
  const [aiState, setAiState] = useState({ status: 'idle', message: '', isVisible: false });
  const [isProcessing, setProcessing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [question, setQuestion] = useState("");
  
  // Data State
  const [currentReportData, setCurrentReportData] = useState(null);
  const [summary, setSummary] = useState("รอข้อมูลจาก Power BI...");
  const [isSummaryLoading, setSummaryLoading] = useState(false);
  const [isSummaryExpanded, setSummaryExpanded] = useState(false);

  // Refs
  const scrollRef = useRef(null); 
  const talkTimerRef = useRef(null);
  const powerBIReportRef = useRef(null);    
  const langRef = useRef(lang);
  const summarizedPageRef = useRef(null);

  const activeAccount = accounts[0];
  const userName = activeAccount?.name || "Admin User";
  const userRole = activeAccount?.idTokenClaims?.roles?.[0] || "Administrator";

  useEffect(() => { langRef.current = lang; }, [lang]);


  // Init Menu
  useEffect(() => {
    const appMenu = [
      { id: "page_overview", title: "สถิติน้ำท่วม 1", type: "powerbi_page", icon: "LayoutDashboard", pageName: "798ca254819667030432" },
      { id: "page_details", title: "สถิติน้ำท่วม 2", type: "powerbi_page", icon: "Map", pageName: "5b3cc48690823dd3da6d" },
      { id: "page_analysis", title: "สถิติน้ำท่วม 3", type: "powerbi_page", icon: "BarChart", pageName: "e93c812d89901cad35c2" }
    ];
    setMenuList(appMenu);
  }, []);

  // ⭐ Logic: เมื่อ Login ผ่านแล้ว (isAuthenticated = true) ให้เริ่มโหลด
  useEffect(() => {
    if (isAuthenticated) {
        // หน่วงเวลา 2.5 วินาที เพื่อแสดงหน้า Loading ก่อนเข้า Dashboard
        const timer = setTimeout(() => {
            setAppReady(true); // บอกว่าพร้อมแล้ว!
        }, 5500);

        return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    async function fetchProfilePhoto() {
      if (!isAuthenticated || !activeAccount) return;
      
      try {
        console.log("📷 กำลังพยายามดึงรูปโปรไฟล์...");

        // 1. ขอ Token โดยระบุบัญชีผู้ใช้ให้ชัดเจน (สำคัญมาก!)
        const tokenResponse = await instance.acquireTokenSilent({
            ...loginRequest,
            account: activeAccount, // 👈 ต้องใส่บรรทัดนี้ ไม่งั้น MSAL จะงงว่าขอให้ใคร
            scopes: ["User.Read"]
        });

        // 2. ยิง API ขอรูป
        const response = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
            headers: { Authorization: `Bearer ${tokenResponse.accessToken}` }
        });

        if (response.ok) {
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            setUserAvatar(imageUrl);
        } else {
            console.error(response.status);
            // ถ้า Status 404 แปลว่า Microsoft บอกว่าไม่มีรูปจริงๆ
        }
      } catch (error) {
        console.error(error);
        // ถ้าเจอ Error นี้ ให้ลองกด Logout แล้ว Login ใหม่ดูครับ
      }
    }

    fetchProfilePhoto();
  }, [isAuthenticated, instance, activeAccount]);

  // --- Functions ---
  const handleLogin = () => {
    instance.loginPopup({
        ...loginRequest,
        prompt: "select_account"
    }).catch(e => console.error(e));
  };

  const handleLogout = () => {
    instance.logoutPopup({
        postLogoutRedirectUri: "/",
        mainWindowRedirectUri: "/"
    });
  };

  const handleAiSpeak = (message, isError = false) => {
      if (talkTimerRef.current) clearTimeout(talkTimerRef.current);
      setAiState({ status: 'talking', message: message, isVisible: true });
      setCountdown(isError ? 10 : 100);
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if(!question.trim()) return;
    
    setProcessing(true); 
    setAiState({ status: 'thinking', message: '', isVisible: false });
    
    try {
        const contextData = currentReportData || "ข้อมูลกราฟยังไม่โหลด";
        const res = await dashboardService.chat(question, contextData, langRef.current); 
        setQuestion(""); 
        handleAiSpeak(res.message);
    } catch (error) {
        handleAiSpeak("ขออภัย ระบบขัดข้อง", true);
    } finally {
        setProcessing(false);
    }
  };

  const handlePowerBIClick = (event) => {
    if (event.detail && event.detail.dataPoints && event.detail.dataPoints.length > 0) {
        const dp = event.detail.dataPoints[0];
        const category = dp.identity[0]?.equals || "Unknown";
        const value = dp.values[0]?.formattedValue || "N/A";
        const chartTitle = event.detail.visual.title || "กราฟ"; 

        if(!isProcessing) {
             setProcessing(true);
             setAiState({ status: 'thinking', message: '', isVisible: false });
             
             dashboardService.getReaction({ name: category, uv: value }, chartTitle, langRef.current)
                .then(res => {
                    handleAiSpeak(res.message);
                    setProcessing(false);
                });
        }
    }
  };

  const handleReportRendered = async () => {
    if (!powerBIReportRef.current) return;
    const currentPage = menuList.find(p => p.id === activePageId);
    if (summarizedPageRef.current === activePageId) return;

    setSummaryLoading(true);
    setSummary("กำลังอ่านข้อมูล...");

    try {
        const activePage = (await powerBIReportRef.current.getPages()).find(p => p.isActive);
        if (!activePage) return;

        const visuals = await activePage.getVisuals();
        let allDataText = `ข้อมูลหน้า ${activePage.displayName}:\n`;

        for (const visual of visuals) {
            if (visual.title && visual.type !== 'image' && visual.type !== 'textbox') {
                try {
                    const result = await visual.exportData(models.ExportDataType.Summarized);
                    allDataText += `\n- ${visual.title}:\n${result.data}\n`;
                } catch (e) { /* ignore */ }
            }
        }
        
        setCurrentReportData(allDataText);
        summarizedPageRef.current = activePageId; 

        const aiRes = await dashboardService.chat("ช่วยสรุป Executive Summary จากข้อมูลนี้", allDataText, langRef.current);

        setSummary(aiRes.message);
        setSummaryExpanded(true);
    } catch (err) {
        setSummary("อ่านข้อมูลไม่ได้");
    } finally {
        setSummaryLoading(false);
    }
  };

  const handleManualRefresh = () => {
      summarizedPageRef.current = null;
      handleReportRendered();
  };

  useEffect(() => {
    let t;
    if (aiState.isVisible && countdown > 0) t = setInterval(() => setCountdown(c => c - 1), 1000);
    else if (countdown === 0) setAiState(p => ({ ...p, isVisible: false, status: 'idle' }));
    return () => clearInterval(t);
  }, [aiState.isVisible, countdown]);


  // 🔴 1. ถ้ายังไม่ Login -> โชว์หน้า Login
  if (!isAuthenticated) {
    return (
        // ส่งฟังก์ชัน handleLogin เข้าไป
        <LoginPage onLogin={handleLogin} />
    );
  }

  // ⭐ 2. ถ้า Login แล้ว แต่ App ยังไม่ Ready (อยู่ในช่วงหน่วงเวลา) -> โชว์ Loading
  if (!isAppReady) {
      return <LoadingScreen />;
  }

  // 🟢 3. ถ้า Login แล้ว และ App Ready -> โชว์ Dashboard
  const currentPage = menuList.find(p => p.id === activePageId);

  return (
    <DashboardLayout
      user={{ 
        name: userName, 
        role: userRole, 
        avatar: userAvatar
      }}
      isSidebarCollapsed={isSidebarCollapsed}
      toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
      scrollRef={scrollRef} 
      summaryWidget={
        <div className={`ai-summary-wrapper ${isSummaryExpanded ? 'expanded' : 'collapsed'}`}>
            <ResultBox text={summary} isExpanded={isSummaryExpanded} toggleExpand={() => setSummaryExpanded(!isSummaryExpanded)} isLoading={isSummaryLoading} onRefresh={handleManualRefresh} />
        </div>
      } 
      rightPanelProps={{
        aiState, countdown, 
        closeAi: () => setAiState(prev => ({ ...prev, isVisible: false, status: 'idle' })),
        userQuestion: question, setUserQuestion: setQuestion, handleAsk,
        currentLang: lang, setCurrentLang: setLang, isProcessing,
        onSpeechEnd: () => setAiState(prev => ({ ...prev, status: 'idle' })),
      }}
      menuItems={menuList}
      activePageId={activePageId}
      onMenuClick={(id) => setActivePageId(id)}
      onLogout={handleLogout}
    >
        <div className="fade-in" style={{ height: '100%', width: '100%' }}>
            <h2 style={{ marginBottom: '10px' }}>📊 {currentPage ? currentPage.title : "Smart Dashboard"}</h2>
            
            <div className="powerbi-container-wrapper" style={{ height: '80vh', width: '100%', background: '#fff', borderRadius: '8px' }}>
               <RealPowerBIEmbed 
                  key={activePageId} 
                  targetPageName={currentPage?.pageName} 
                  eventHandlers={new Map([['dataSelected', handlePowerBIClick]])}
                  getEmbeddedComponent={(report) => { powerBIReportRef.current = report; }}
                  onReportRendered={handleReportRendered} 
               />
            </div>
        </div>
    </DashboardLayout>
  );
}

export default App;