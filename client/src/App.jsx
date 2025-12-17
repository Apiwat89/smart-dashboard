import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { models } from 'powerbi-client'; 

// Auth
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "./authConfig";

// Layouts & Widgets
import DashboardLayout from './components/Layout/DashboardLayout';
import LoadingScreen from './components/Layout/LoadingScreen';
import RealPowerBIEmbed from './components/Widgets/PowerBIEmbed'; 
import ResultBox from './components/Widgets/ResultBox';
import LoginPage from './components/Layout/LoginPage';

// API
import { dashboardService } from './api/apiClient';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Auth State
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const [isAppReady, setAppReady] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);

  // App State
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [menuList, setMenuList] = useState([]);
  const [activePageId, setActivePageId] = useState("page_overview");
  const [lastUpdated, setLastUpdated] = useState(""); // เก็บเวลาอัปเดตล่าสุด

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

  // Notification State
  const [notifications, setNotifications] = useState([]);

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

  useEffect(() => {
    // บรรทัดนี้คือการไปแปะป้าย data-theme="dark" ที่แท็ก <html>
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme); // จำค่าไว้เผื่อรีเฟรช
  }, [theme]);

  // Init Menu
  useEffect(() => {
    const appMenu = [
      { id: "page_overview", title: "สถิติน้ำท่วม 1", type: "powerbi_page", icon: "LayoutDashboard", pageName: "798ca254819667030432" },
      { id: "page_details", title: "สถิติน้ำท่วม 2", type: "powerbi_page", icon: "Map", pageName: "5b3cc48690823dd3da6d" },
      { id: "page_analysis", title: "สถิติน้ำท่วม 3", type: "powerbi_page", icon: "BarChart", pageName: "e93c812d89901cad35c2" }
    ];
    setMenuList(appMenu);
  }, []);

  // ⭐ Logic: เมื่อ Login ผ่านแล้ว ให้เริ่มโหลด
  useEffect(() => {
    if (isAuthenticated) {
        const timer = setTimeout(() => {
            setAppReady(true); 
        }, 2500); // ลดเวลาลงนิดนึงเพื่อความเร็ว
        return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  // ดึงรูปโปรไฟล์
  useEffect(() => {
    async function fetchProfilePhoto() {
      if (!isAuthenticated || !activeAccount) return;
      try {
        const tokenResponse = await instance.acquireTokenSilent({
            ...loginRequest,
            account: activeAccount, 
            scopes: ["User.Read"]
        });
        const response = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
            headers: { Authorization: `Bearer ${tokenResponse.accessToken}` }
        });
        if (response.ok) {
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            setUserAvatar(imageUrl);
        }
      } catch (error) { console.log(error); }
    }
    fetchProfilePhoto();
  }, [isAuthenticated, instance, activeAccount]);


  // --- Helper Functions ---

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // ⭐ 1. ฟังก์ชันสร้างแจ้งเตือน (ประกาศไว้บนสุดเพื่อให้เรียกใช้ได้)
  const addNotification = (type, title, message) => {
    const newNotif = {
        type, // 'alert', 'success', 'info'
        title,
        message,
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 99));
  };

  // ⭐ 2. ฟังก์ชันขอ Token
  const getToken = async () => {
    if (!activeAccount) return null;
    try {
        const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account: activeAccount
        });
        return response.accessToken;
    } catch (error) {
        console.error("Get Token Error:", error);
        return null;
    }
  };

  const handleLogin = () => {
    instance.loginRedirect({
        ...loginRequest,
        prompt: "select_account"
    }).catch(e => console.error(e));
  };

  const handleLogout = () => {
    instance.logoutRedirect({
        postLogoutRedirectUri: "/", 
        account: activeAccount      
    });
  };

  const handleAiSpeak = (message, isError = false) => {
      if (talkTimerRef.current) clearTimeout(talkTimerRef.current);
      setAiState({ status: 'talking', message: message, isVisible: true });
      setCountdown(isError ? 10 : 100);
  };

  const triggerAiChat = async (textInput) => {
      if(!textInput || !textInput.trim()) return;
      setProcessing(true);
      setAiState({ status: 'thinking', message: '', isVisible: false });
      try {
          const token = await getToken(); 
          const contextData = currentReportData || "ข้อมูลกราฟยังไม่โหลด";
          const res = await dashboardService.chat(textInput, contextData, langRef.current, token); 
          handleAiSpeak(res.message);
      } catch (error) {
          handleAiSpeak("ขออภัย ระบบขัดข้อง", true);
      } finally {
          setProcessing(false);
      }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if(!question.trim()) return;
    triggerAiChat(question);
    setQuestion(""); 
  };

  const handleHeaderSearch = (text) => {
      setQuestion(text);
      triggerAiChat(text);
  };

  const handlePowerBIClick = async (event) => {
    if (event.detail && event.detail.dataPoints && event.detail.dataPoints.length > 0) {
        const dp = event.detail.dataPoints[0];
        const category = dp.identity[0]?.equals || "Unknown";
        const value = dp.values[0]?.formattedValue || "N/A";
        const chartTitle = event.detail.visual.title || "กราฟ"; 

        if(!isProcessing) {
             setProcessing(true);
             setAiState({ status: 'thinking', message: '', isVisible: false });
             
             const token = await getToken(); 
             dashboardService.getReaction({ name: category, uv: value }, chartTitle, langRef.current, token)
                .then(res => {
                    handleAiSpeak(res.message);
                    setProcessing(false);
                });
        }
    }
  };

  // ⭐ Logic อ่านข้อมูลกราฟ + แจ้งเตือน
  const handleReportRendered = async () => {
    if (!powerBIReportRef.current) return;
    const activePage = menuList.find(p => p.id === activePageId);
    if (summarizedPageRef.current === activePageId) return;

    // 1. แจ้งเตือนว่าโหลดเสร็จแล้ว
    addNotification('success', 'อัปเดตข้อมูลแล้ว', `โหลดข้อมูลหน้า ${activePage.title} เรียบร้อย`);
    
    setSummaryLoading(true);
    setSummary("กำลังอ่านข้อมูล...");

    try {
        const pbiPage = (await powerBIReportRef.current.getPages()).find(p => p.isActive);
        if (!pbiPage) return;

        const visuals = await pbiPage.getVisuals();
        let allDataText = `ข้อมูลหน้า ${activePage.displayName}:\n`;
        let foundUpdateDate = null;

        for (const visual of visuals) {
            if (visual.title && visual.type !== 'image' && visual.type !== 'textbox') {
                try {
                    const result = await visual.exportData(models.ExportDataType.Summarized);
                    allDataText += `\n- ${visual.title}:\n${result.data}\n`;

                    // ดักจับวันที่ (ถ้ามี)
                    if (visual.title === "LastUpdate") {
                        const lines = result.data.split('\n');
                        if (lines.length >= 2) foundUpdateDate = lines[1].trim();
                    }
                } catch (e) { /* ignore */ }
            }
        }
        
        setCurrentReportData(allDataText);
        summarizedPageRef.current = activePageId; 
        
        // อัปเดตเวลาที่ Header
        if(foundUpdateDate) setLastUpdated(foundUpdateDate);
        else setLastUpdated(new Date().toLocaleDateString('th-TH') + " (App Time)");

        // 2. ให้ AI สรุปข้อมูล (Full Summary)
        const token = await getToken(); 
        const aiRes = await dashboardService.chat("ช่วยสรุป Executive Summary จากข้อมูลนี้", allDataText, langRef.current, token);
        setSummary(aiRes.message);
        setSummaryExpanded(true);

        // 3. ให้ AI แจ้งเตือนถ้าเจอวิกฤต (Quick Alert)
        dashboardService.chat(
            "จากข้อมูลนี้ มีจุดไหนที่ตัวเลขดู 'วิกฤต' หรือ 'น่าเป็นห่วง' ไหม? ขอสั้นๆ 1 ประโยค ถ้าไม่มีให้ตอบว่า 'สถานการณ์ปกติ'", 
            allDataText, 
            langRef.current, 
            token
        ).then(res => {
            if (!res.message.includes("ปกติ")) {
                addNotification('alert', 'พบสิ่งผิดปกติ!', res.message);
            } else {
                addNotification('info', 'AI Insight', 'สถานการณ์โดยรวมปกติดีครับ');
            }
        });

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
        <LoginPage onLogin={handleLogin} />
    );
  }

  // ⭐ 2. ถ้า Login แล้ว แต่ App ยังไม่ Ready -> โชว์ Loading
  if (!isAppReady) {
      return <LoadingScreen />;
  }

  // 🟢 3. เข้า Dashboard
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
      onSearch={handleHeaderSearch}
      pageTitle={currentPage ? currentPage.title : "Smart Dashboard"}
      lastUpdated={lastUpdated}     // ⭐ ส่งเวลาไป
      notifications={notifications} // ⭐ ส่งแจ้งเตือนไป
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
      theme={theme}             // 👈 ส่งไป
      toggleTheme={toggleTheme} // 👈 ส่งไป
    >
        <div className="fade-in" style={{ height: '100%', width: '100%' }}>
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