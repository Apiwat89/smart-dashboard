import React, { useState, useEffect, useRef, useMemo } from 'react';
import './App.css';
import { models } from 'powerbi-client';

// Auth
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "./authConfig";

// Components
import DashboardLayout from './components/Layout/DashboardLayout';
import LoadingScreen from './components/Layout/LoadingScreen';
import RealPowerBIEmbed from './components/Widgets/PowerBIEmbed';
import ResultBox from './components/Widgets/ResultBox';
import LoginPage from './components/Layout/LoginPage';

// API
import { dashboardService } from './api/apiClient';

// Constants
const TIMER_DURATION = 20;
const INITIAL_PANEL_WIDTH = 380;

function App() {
  // --- 1. State Management Grouping ---
  
  // UI & Layout State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isAppReady, setAppReady] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(INITIAL_PANEL_WIDTH);
  const [activePageId, setActivePageId] = useState("page_overview");
  const [menuList, setMenuList] = useState([]);
  
  // Auth & User State
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [userAvatar, setUserAvatar] = useState(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Ticker & Notification State
  const [tickerText, setTickerText] = useState("กำลังเชื่อมต่อดาวเทียมสภาพอากาศ...");
  const [tickerType, setTickerType] = useState("info");
  const [notifications, setNotifications] = useState([]);

  // Auto-Play State
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayCountdown, setAutoPlayCountdown] = useState(TIMER_DURATION);

  // AI & Mascot State
  const [lang, setLang] = useState('TH');
  const [aiState, setAiState] = useState({ status: 'idle', message: '', isVisible: false });
  const [isProcessing, setProcessing] = useState(false);
  const [question, setQuestion] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  
  // Data & Summary State
  const [currentReportData, setCurrentReportData] = useState(null);
  const [summary, setSummary] = useState("รอข้อมูลจาก Power BI...");
  const [isSummaryLoading, setSummaryLoading] = useState(false);

  // Refs
  const scrollRef = useRef(null);
  const talkTimerRef = useRef(null);
  const powerBIReportRef = useRef(null);
  const langRef = useRef(lang);
  const summarizedPageRef = useRef(null);
  const isResizing = useRef(false);

  // --- 2. Computed Values ---
  const activeAccount = accounts[0];
  const userInfo = useMemo(() => {
    if (!activeAccount) return { name: "Guest", displayRole: "Guest" };
    const roles = activeAccount.idTokenClaims?.roles || [];
    return { 
      name: activeAccount.name || "User", 
      displayRole: roles.length > 0 ? roles.join(" | ") : "General User" 
    };
  }, [activeAccount]);

  const currentPage = menuList.find(p => p.id === activePageId);

  // --- 3. Effects ---

  // Initialization & Auth Checks
  useEffect(() => {
    if (isAuthenticated && isAppReady && userInfo.displayRole === "General User") {
      setIsUnauthorized(true);
    }
  }, [isAuthenticated, isAppReady, userInfo]);

  useEffect(() => { langRef.current = lang; }, [lang]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load Menu
  useEffect(() => {
    setMenuList([
      { id: "page_overview", title: "สถิติน้ำท่วม 1", type: "powerbi_page", icon: "LayoutDashboard", pageName: "798ca254819667030432" },
      { id: "page_details", title: "สถิติน้ำท่วม 2", type: "powerbi_page", icon: "Map", pageName: "5b3cc48690823dd3da6d" },
      { id: "page_analysis", title: "สถิติน้ำท่วม 3", type: "powerbi_page", icon: "BarChart", pageName: "e93c812d89901cad35c2" }
    ]);
  }, []);

  // Fake Loading Time
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => setAppReady(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  // Fetch Profile Photo
  useEffect(() => {
    const fetchPhoto = async () => {
      if (!isAuthenticated || !activeAccount) return;
      try {
        const tokenRes = await instance.acquireTokenSilent({ ...loginRequest, account: activeAccount, scopes: ["User.Read"] });
        const response = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
          headers: { Authorization: `Bearer ${tokenRes.accessToken}` }
        });
        if (response.ok) {
          const blob = await response.blob();
          setUserAvatar(URL.createObjectURL(blob));
        }
      } catch (e) { console.error("Photo fetch error:", e); }
    };
    fetchPhoto();
  }, [isAuthenticated, activeAccount, instance]);

  // Auto-Play Logic
  useEffect(() => {
    let interval;
    if (isPlaying && menuList.length > 0) {
      interval = setInterval(() => setAutoPlayCountdown(prev => (prev <= 0 ? 0 : prev - 1)), 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, menuList]);

  useEffect(() => {
    if (isPlaying && autoPlayCountdown === 0) {
      stopAllVoices();
      setActivePageId(prevId => {
        const currentIndex = menuList.findIndex(item => item.id === prevId);
        const nextIndex = (currentIndex + 1) % menuList.length;
        return menuList[nextIndex].id;
      });
      setAutoPlayCountdown(TIMER_DURATION);
    }
  }, [autoPlayCountdown, isPlaying, menuList]);

  // --- 4. Logic Functions ---

  const getToken = async () => {
    if (!activeAccount) return null;
    try {
      const res = await instance.acquireTokenSilent({ ...loginRequest, account: activeAccount });
      return res.accessToken;
    } catch { return null; }
  };

  const stopAllVoices = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (talkTimerRef.current) {
      clearTimeout(talkTimerRef.current);
      talkTimerRef.current = null;
    }
  };

  const handleAiSpeak = (text, isError = false) => {
    stopAllVoices();
    setAiState({ status: isError ? 'error' : 'talking', message: text, isVisible: true });
  };

  const triggerAiChat = async (textInput) => {
    if (!textInput?.trim()) return;
    
    stopAllVoices();
    setSummaryLoading(true);
    setSummary("");
    setProcessing(true);
    setAiState({ status: 'thinking', message: '', isVisible: true });

    try {
      const token = await getToken();
      const res = await dashboardService.chat(textInput, currentReportData || "", langRef.current, token);
      setSummary(res.message);
      handleAiSpeak(res.message);
    } catch (e) {
      setSummary("เกิดข้อผิดพลาด");
      handleAiSpeak("ระบบขัดข้อง", true);
    } finally {
      setProcessing(false);
      setSummaryLoading(false);
    }
  };

  const handlePowerBIClick = async (event) => {
    if (isProcessing) return;
    if (event.detail?.dataPoints?.length > 0) {
      const dp = event.detail.dataPoints[0];
      const category = dp.identity[0]?.equals || "Unknown";
      const value = dp.values[0]?.formattedValue || "N/A";
      const chartTitle = event.detail.visual.title || "กราฟ";

      setSummaryLoading(true);
      setSummary("");
      setProcessing(true);
      stopAllVoices();
      setAiState({ status: 'thinking', message: '', isVisible: true });

      try {
        const token = await getToken();
        const res = await dashboardService.getReaction({ name: category, uv: value }, chartTitle, langRef.current, token);
        setSummary(res.message);
        handleAiSpeak(res.message);
      } catch (e) {
        setSummary("Error analyzing selection.");
        handleAiSpeak("ขออภัยค่ะ ข้อมูลส่วนนี้ขัดข้อง", true);
      } finally {
        setProcessing(false);
        setSummaryLoading(false);
      }
    }
  };

  const handleReportRendered = async () => {
    if (!powerBIReportRef.current || summarizedPageRef.current === activePageId) return;

    setSummaryLoading(true);
    setSummary("กำลังอ่านข้อมูล...");

    try {
      const pages = await powerBIReportRef.current.getPages();
      const pbiPage = pages.find(p => p.isActive);
      if (!pbiPage) return;

      const visuals = await pbiPage.getVisuals();
      let allDataText = `ข้อมูลหน้า ${currentPage?.title}:\n`;

      for (const visual of visuals) {
        if (visual.title && !['image', 'textbox'].includes(visual.type)) {
          try {
            const result = await visual.exportData(models.ExportDataType.Summarized);
            allDataText += `\n- ${visual.title}:\n${result.data}\n`;
          } catch (e) { /* Ignore non-exportable visuals */ }
        }
      }

      setCurrentReportData(allDataText);
      summarizedPageRef.current = activePageId;
      const token = await getToken();

      // Parallel Requests: Summary & Questions
      const [aiRes, suggestRes] = await Promise.all([
        dashboardService.chat("ช่วยสรุป Executive Summary", allDataText, langRef.current, token),
        dashboardService.chat("แนะนำ 3 คำถามสำคัญสั้นๆ แยกบรรทัดกัน", allDataText, langRef.current, token)
      ]);

      setSummary(aiRes.message);
      handleAiSpeak(aiRes.message);

      const questions = suggestRes.message.split('\n')
        .map(q => q.replace(/^\d+\.\s*/, '').trim())
        .filter(q => q.length > 5)
        .slice(0, 3);
      setSuggestedQuestions(questions);

    } catch (err) {
      setSummary("ไม่สามารถประมวลผลข้อมูลได้");
    } finally {
      setSummaryLoading(false);
    }
  };

  // Resizing Logic
  const startResizing = () => {
    isResizing.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };
  const handleMouseMove = (e) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 280 && newWidth < 600) setRightPanelWidth(newWidth);
  };
  const stopResizing = () => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  };

  // --- 5. Render Conditions ---

  if (!isAuthenticated) return <LoginPage onLogin={() => instance.loginRedirect(loginRequest)} />;
  if (!isAppReady) return <LoadingScreen />;
  if (isUnauthorized) return (
    <div className="access-denied-overlay">
      <div className="access-denied-modal">
        <div className="access-denied-icon">⛔</div>
        <h2>Access Denied</h2>
        <p>บัญชี {userInfo.name} ไม่มีสิทธิ์เข้าใช้งาน</p>
        <button onClick={() => instance.logoutRedirect({ postLogoutRedirectUri: "/", account: activeAccount })}>ออกจากระบบ</button>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      menuItems={menuList}
      activePageId={activePageId}
      onMenuClick={(id) => {
        setActivePageId(id);
        if (isPlaying) setAutoPlayCountdown(TIMER_DURATION);
      }}
      rightPanelWidth={rightPanelWidth}
      onResizerMouseDown={startResizing}
      user={{ name: userInfo.name, role: userInfo.displayRole, avatar: userAvatar }}
      isSidebarCollapsed={isSidebarCollapsed}
      toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
      scrollRef={scrollRef}
      onSearch={(text) => { setQuestion(text); triggerAiChat(text); }}
      pageTitle={currentPage ? currentPage.title : "Smart Dashboard"}
      notifications={notifications}
      isPlaying={isPlaying}
      togglePlay={() => setIsPlaying(!isPlaying)}
      autoPlayCountdown={autoPlayCountdown}
      theme={theme}
      toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
      newsText={tickerText}
      newsType={tickerType}
      rightPanelProps={{
        aiState: { ...aiState, isVisible: ['talking', 'thinking'].includes(aiState.status) ? true : aiState.isVisible },
        countdown: 0,
        closeAi: () => setAiState(p => ({ ...p, isVisible: false, status: 'idle' })),
        userQuestion: question,
        setUserQuestion: setQuestion,
        handleAsk: (e) => { e.preventDefault(); triggerAiChat(question); setQuestion(""); },
        currentLang: lang,
        setCurrentLang: setLang,
        isProcessing,
        onSpeechEnd: () => setAiState(p => ({ ...p, status: 'idle' })),
        suggestedQuestions,
        onSelectQuestion: (q) => { setSummaryLoading(true); setSummary(""); triggerAiChat(q); },
        summaryWidget: (
          <div className="ai-summary-in-panel">
            <ResultBox
              text={aiState.status === 'talking' ? aiState.message : summary}
              isLoading={isSummaryLoading}
              onRefresh={() => { summarizedPageRef.current = null; handleReportRendered(); }}
            />
          </div>
        )
      }}
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