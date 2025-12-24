import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  // State สำหรับข่าวตัววิ่ง
  const [tickerText, setTickerText] = useState("กำลังเชื่อมต่อดาวเทียมสภาพอากาศ...");
  const [tickerType, setTickerType] = useState("info");

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
  const [lastUpdated, setLastUpdated] = useState(""); 

  // Auto-Play State
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayCountdown, setAutoPlayCountdown] = useState(90);
  const TIMER_DURATION = 90; 

  // AI State
  const [lang, setLang] = useState('TH');
  const [aiState, setAiState] = useState({ status: 'idle', message: '', isVisible: false });
  const [isProcessing, setProcessing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [question, setQuestion] = useState("");

  // ⭐ เพิ่ม State สำหรับคำถามที่ AI แนะนำ
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  
  // Data State
  const [currentReportData, setCurrentReportData] = useState(null);
  const [summary, setSummary] = useState("รอข้อมูลจาก Power BI...");
  const [isSummaryLoading, setSummaryLoading] = useState(false);
  const [isSummaryExpanded, setSummaryExpanded] = useState(false);
  const [summaryAutoClose, setSummaryAutoClose] = useState(0);
  const [isHoveringSummary, setIsHoveringSummary] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState([]);

  // Refs
  const scrollRef = useRef(null); 
  const talkTimerRef = useRef(null);
  const powerBIReportRef = useRef(null);    
  const langRef = useRef(lang);
  const summarizedPageRef = useRef(null);

  const activeAccount = accounts[0];
  const userInfo = useMemo(() => {
    if (!activeAccount) return { name: "Guest", displayRole: "Guest" };
    const name = activeAccount.name || "User";
    const rolesFromAzure = activeAccount.idTokenClaims?.roles || [];
    let finalDisplayRole = rolesFromAzure.length > 0 ? rolesFromAzure.join(" | ") : "General User";
    return { name: name, displayRole: finalDisplayRole };
  }, [activeAccount]);

  const [isUnauthorized, setIsUnauthorized] = useState(false);
  useEffect(() => {
    if (isAuthenticated && isAppReady) {
       if (userInfo.displayRole === "General User") {
          setIsUnauthorized(true);
       }
    }
  }, [isAuthenticated, isAppReady, userInfo]);

  useEffect(() => { langRef.current = lang; }, [lang]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme); 
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

  // Auto-Play Logic
  useEffect(() => {
    let interval;
    if (isPlaying && menuList.length > 0) {
      interval = setInterval(() => {
        setAutoPlayCountdown(prev => (prev <= 0 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, menuList]);

  useEffect(() => {
    if (isPlaying && autoPlayCountdown === 0) {
        setActivePageId((currentId) => {
            let currentIndex = menuList.findIndex(item => item.id === currentId);
            if (currentIndex === -1) currentIndex = 0;
            const nextIndex = (currentIndex + 1) % menuList.length;
            return menuList[nextIndex].id;
        });
        setAutoPlayCountdown(TIMER_DURATION);
    }
  }, [autoPlayCountdown, isPlaying, menuList, TIMER_DURATION]);

  // Summary Auto Close Logic
  useEffect(() => {
    let timer;
    if (isSummaryExpanded && summaryAutoClose > 0 && !isHoveringSummary) {
      timer = setTimeout(() => {
        setSummaryAutoClose(prev => prev - 1);
      }, 1000);
    } 
    else if (summaryAutoClose === 0 && isSummaryExpanded) {
      setSummaryExpanded(false);
    }
    return () => clearTimeout(timer);
  }, [summaryAutoClose, isSummaryExpanded, isHoveringSummary]);

  // Loading Logic
  useEffect(() => {
    if (isAuthenticated) {
        const timer = setTimeout(() => { setAppReady(true); }, 2500); 
        return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  // Profile Photo Logic
  useEffect(() => {
    async function fetchProfilePhoto() {
      if (!isAuthenticated || !activeAccount) return;
      try {
        const tokenResponse = await instance.acquireTokenSilent({
            ...loginRequest, account: activeAccount, scopes: ["User.Read"]
        });
        const response = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
            headers: { Authorization: `Bearer ${tokenResponse.accessToken}` }
        });
        if (response.ok) {
            const blob = await response.blob();
            setUserAvatar(URL.createObjectURL(blob));
        }
      } catch (error) { console.log(error); }
    }
    fetchProfilePhoto();
  }, [isAuthenticated, instance, activeAccount]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const addNotification = (type, title, message) => {
    const newNotif = { type, title, message, time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) };
    setNotifications(prev => [newNotif, ...prev].slice(0, 99));
  };

  const getToken = async () => {
    if (!activeAccount) return null;
    try {
        const response = await instance.acquireTokenSilent({ ...loginRequest, account: activeAccount });
        return response.accessToken;
    } catch (error) { console.error("Get Token Error:", error); return null; }
  };

  const handleLogin = () => { instance.loginRedirect({ ...loginRequest, prompt: "select_account" }).catch(e => console.error(e)); };
  const handleLogout = () => { instance.logoutRedirect({ postLogoutRedirectUri: "/", account: activeAccount }); };

  const handleAiSpeak = (message, isError = false) => {
    // ⭐ ล้าง Timer เดิมทิ้งเพื่อไม่ให้สถานะ idle ไปทับสถานะพูดใหม่
    if (talkTimerRef.current) {
        clearTimeout(talkTimerRef.current);
        talkTimerRef.current = null;
    }
    
    // ตั้งสถานะใหม่
    setAiState({ status: 'talking', message: message, isVisible: true });
    setCountdown(isError ? 10 : 100);
};

// App.jsx

const triggerAiChat = async (textInput) => {
  if(!textInput || !textInput.trim()) return;
  
  // 1. ⭐ เริ่มแสดงสถานะ Loading ในกล่อง Summary
  setSummaryLoading(true); 
  setSummary(""); // เคลียร์ข้อความเก่าออกเพื่อให้ขึ้นสถานะ Generating...
  
  setProcessing(true);
  setAiState({ status: 'thinking', message: '', isVisible: false });

  try {
      const token = await getToken(); 
      const contextData = currentReportData || "ข้อมูลกราฟยังไม่โหลด";
      const res = await dashboardService.chat(textInput, contextData, langRef.current, token); 
      
      // 2. เมื่อได้คำตอบ: อัปเดตข้อความและสั่งให้ Mascot พูด
      setSummary(res.message); 
      handleAiSpeak(res.message);
      
      // มั่นใจว่ากล่อง Summary กางออกเพื่อเห็นคำตอบ
      setSummaryExpanded(true); 
      setSummaryAutoClose(20); // ตั้งเวลาปิดอัตโนมัติ (ถ้าต้องการ)

  } catch (error) { 
      setSummary("ขออภัย เกิดข้อผิดพลาดในการดึงข้อมูล");
      handleAiSpeak("ขออภัย ระบบขัดข้อง", true); 
  } finally { 
      // 3. ⭐ ปิดสถานะ Loading
      setProcessing(false); 
      setSummaryLoading(false); 
  }
};

  const handleAsk = async (e) => {
    e.preventDefault();
    if(!question.trim()) return;
    triggerAiChat(question);
    setQuestion(""); 
  };

  const handleHeaderSearch = (text) => { setQuestion(text); triggerAiChat(text); };

  const handlePowerBIClick = async (event) => {
    if (event.detail && event.detail.dataPoints && event.detail.dataPoints.length > 0 && !isProcessing) {
         const dp = event.detail.dataPoints[0];
         const category = dp.identity[0]?.equals || "Unknown";
         const value = dp.values[0]?.formattedValue || "N/A";
         const chartTitle = event.detail.visual.title || "กราฟ"; 
         setProcessing(true);
         setAiState({ status: 'thinking', message: '', isVisible: false });
         const token = await getToken(); 
         dashboardService.getReaction({ name: category, uv: value }, chartTitle, langRef.current, token)
            .then(res => { handleAiSpeak(res.message); setProcessing(false); });
    }
  };

  // ⭐ แก้ไข handleReportRendered เพื่อเพิ่ม Suggested Questions
  const handleReportRendered = async () => {
    if (!powerBIReportRef.current) return;
    const activePage = menuList.find(p => p.id === activePageId);
    if (summarizedPageRef.current === activePageId) return;

    addNotification('success', 'อัปเดตข้อมูลแล้ว', `โหลดข้อมูลหน้า ${activePage.title} เรียบร้อย`);
    setSummaryLoading(true);
    setSummary("กำลังอ่านข้อมูล...");

    try {
        const pbiPage = (await powerBIReportRef.current.getPages()).find(p => p.isActive);
        if (!pbiPage) return;
        
        const visuals = await pbiPage.getVisuals();
        let allDataText = `ข้อมูลหน้า ${activePage.title}:\n`;
        
        for (const visual of visuals) {
            if (visual.title && visual.type !== 'image' && visual.type !== 'textbox') {
                try {
                    const result = await visual.exportData(models.ExportDataType.Summarized);
                    allDataText += `\n- ${visual.title}:\n${result.data}\n`;
                } catch (e) { console.warn(e); }
            }
        }
        
        setCurrentReportData(allDataText);
        summarizedPageRef.current = activePageId; 

        const token = await getToken(); 

        // 1. สรุป Executive Summary
        const aiRes = await dashboardService.chat("ช่วยสรุป Executive Summary จากข้อมูลนี้", allDataText, langRef.current, token);
        setSummary(aiRes.message); 
        handleAiSpeak(aiRes.message);
        setSummaryExpanded(true);
        setSummaryAutoClose(20);

        // 2. ⭐ วิเคราะห์คำถามที่แนะนำ (Suggested Questions)
        const suggestPrompt = "จากข้อมูลนี้ ช่วยแนะนำ 3 คำถามสำคัญที่ผู้บริหารควรถาม โดยขอเป็นประโยคคำถามสั้นๆ 3 ข้อ แยกบรรทัดกัน";
        const suggestRes = await dashboardService.chat(suggestPrompt, allDataText, langRef.current, token);
        
        // แยกข้อความเป็น Array
        const questions = suggestRes.message.split('\n')
                           .map(q => q.replace(/^\d+\.\s*/, '').trim()) // ลบตัวเลข 1. 2. ออก
                           .filter(q => q.length > 5)
                           .slice(0, 3);
        setSuggestedQuestions(questions);

    } catch (err) { 
        console.error("Report Error:", err);
        setSummary("ไม่สามารถประมวลผลข้อมูลในหน้านี้ได้"); 
    } finally { setSummaryLoading(false); }
  };

  const handleManualRefresh = () => { summarizedPageRef.current = null; handleReportRendered(); };

  useEffect(() => {
    let t;
    if (aiState.isVisible && countdown > 0) t = setInterval(() => setCountdown(c => c - 1), 1000);
    else if (countdown === 0) setAiState(p => ({ ...p, isVisible: false, status: 'idle' }));
    return () => clearInterval(t);
  }, [aiState.isVisible, countdown]);

  if (!isAuthenticated) return <LoginPage onLogin={handleLogin} />;
  if (!isAppReady) return <LoadingScreen />;

  if (isUnauthorized) {
    return (
      <div className="access-denied-overlay">
        <div className="access-denied-modal">
          <div className="access-denied-icon">⛔</div>
          <h2 className="access-denied-title">Access Denied</h2>
          <h3 className="access-denied-subtitle">การเข้าถึงถูกปฏิเสธ</h3>
          <p className="access-denied-text">
            บัญชี <strong>{userInfo.name}</strong> ไม่มีสิทธิ์เข้าใช้งานในส่วนนี้ <br/>
            กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์
          </p>
          <button className="access-denied-button" onClick={handleLogout}>ออกจากระบบ (Logout)</button>
        </div>
      </div>
    );
  }

  const currentPage = menuList.find(p => p.id === activePageId);

  return (
    <DashboardLayout
      user={{ name: userInfo.name, role: userInfo.displayRole, avatar: userAvatar }}
      isSidebarCollapsed={isSidebarCollapsed}
      toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
      scrollRef={scrollRef} 
      onSearch={handleHeaderSearch}
      pageTitle={currentPage ? currentPage.title : "Smart Dashboard"}
      lastUpdated={lastUpdated}
      notifications={notifications}
      isPlaying={isPlaying}
      togglePlay={() => setIsPlaying(!isPlaying)}
      autoPlayCountdown={autoPlayCountdown}
      
      rightPanelProps={{
        aiState: {
          ...aiState,
          // ⭐ บังคับให้เป็น true เมื่อสถานะคือ talking เพื่อให้ CharacterZone ทำงานได้
          isVisible: aiState.status === 'talking' ? true : aiState.isVisible 
        },
        countdown,
        closeAi: () => setAiState(prev => ({ ...prev, isVisible: false, status: 'idle' })),
        userQuestion: question, 
        setUserQuestion: setQuestion, 
        handleAsk,
        currentLang: lang, 
        setCurrentLang: setLang, 
        isProcessing,
        onSpeechEnd: () => setAiState(prev => ({ ...prev, status: 'idle' })),
        // ⭐ ส่งค่าคำถามที่แนะนำและฟังก์ชันจัดการไปให้ RightPanel
        suggestedQuestions: suggestedQuestions,
        onSelectQuestion: (q) => triggerAiChat(q),
        summaryWidget: (
          <div className="ai-summary-in-panel">
            <ResultBox 
              text={aiState.status === 'talking' ? aiState.message : summary} 
              isExpanded={true} 
              isLoading={isSummaryLoading} 
              onRefresh={handleManualRefresh} 
              autoCloseTimer={summaryAutoClose}
              isHovering={isHoveringSummary}
            />
          </div>
        )
      }}
      menuItems={menuList}
      activePageId={activePageId}
      onMenuClick={(id) => setActivePageId(id)}
      onLogout={handleLogout}
      theme={theme}
      toggleTheme={toggleTheme}
      newsText={tickerText}
      newsType={tickerType}
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