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
  // --------------------------------------- mock new -------------------------------------
  // State สำหรับข่าวตัววิ่ง
  const [tickerText, setTickerText] = useState("กำลังเชื่อมต่อดาวเทียมสภาพอากาศ...");
  const [tickerType, setTickerType] = useState("info");

  // ⭐ 1. สร้างคลังข้อมูลจำลอง (Mock Data Bank)
  const mockData = {
    provinces: ["เชียงใหม่", "เชียงราย", "น่าน", "แพร่", "อุบลราชธานี", "นครสวรรค์", "พระนครศรีอยุธยา", "กรุงเทพมหานคร", "ภูเก็ต"],
    dams: ["เขื่อนภูมิพล", "เขื่อนสิริกิติ์", "เขื่อนป่าสักชลสิทธิ์", "เขื่อนขุนด่านฯ", "เขื่อนลำตะคอง"],
    weathers: ["ฝนตกหนัก 🌧️", "ท้องฟ้าโปร่ง ☀️", "มีเมฆมาก ☁️", "พายุฝนฟ้าคะนอง ⛈️"],
    warnings: ["ระดับน้ำปกติ 🟢", "เฝ้าระวังน้ำล้นตลิ่ง 🟡", "วิกฤตน้ำท่วมฉับพลัน 🔴"]
  };

  // ⭐ 2. ฟังก์ชันสุ่มข่าว (The Generator)
  const generateLiveNews = () => {
    // สุ่มจังหวัด
    const province = mockData.provinces[Math.floor(Math.random() * mockData.provinces.length)];
    
    // สุ่มเขื่อน และสุ่มตัวเลข % น้ำ (60-100%)
    const dam = mockData.dams[Math.floor(Math.random() * mockData.dams.length)];
    const waterLevel = (Math.random() * (100 - 60) + 60).toFixed(1); 
    
    // สุ่มสถานการณ์
    const warning = mockData.warnings[Math.floor(Math.random() * mockData.warnings.length)];
    const weather = mockData.weathers[Math.floor(Math.random() * mockData.weathers.length)];
    
    // สร้างประโยคข่าว 3 แบบ แล้วเอามาต่อกัน
    const news1 = `📍 ${province}: ${weather} (ปริมาณฝนสะสม ${Math.floor(Math.random() * 100)} มม.)`;
    const news2 = `💧 ${dam}: ปริมาณน้ำกักเก็บ ${waterLevel}% (${warning})`;
    const news3 = `📢 ประกาศกรมอุตุฯ: คาดการณ์พายุลูกใหม่เข้าไทยในอีก ${Math.floor(Math.random() * 48)} ชม.`;

    const fullNews = `${news1}   |   ${news2}   |   ${news3}`;

    setTickerText(fullNews);

    // ถ้ามีคำว่า "วิกฤต" หรือ "แดง" ให้เปลี่ยนสีแถบเป็น Alert
    if (fullNews.includes("วิกฤต") || fullNews.includes("🔴")) {
        setTickerType("alert");
    } else {
        setTickerType("info");
    }
  };
  // ------------------------------------------------------------------------------------

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

  // ⭐ Auto-Play State (เพิ่มใหม่)
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayCountdown, setAutoPlayCountdown] = useState(90);
  const TIMER_DURATION = 90; 

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
    // 1. กัน Error กรณีไม่มีข้อมูล
    if (!activeAccount) return { name: "Guest", displayRole: "Guest" };

    const name = activeAccount.name || "User";

    // ⭐⭐⭐ จุดเปลี่ยนสำคัญ: ใช้สูตร Generic (อัตโนมัติ) ⭐⭐⭐
    // ดึง Role ทั้งหมดที่ Azure ส่งมา (ส่งมาเป็น Array List)
    const rolesFromAzure = activeAccount.idTokenClaims?.roles || [];

    let finalDisplayRole = "";

    if (rolesFromAzure.length > 0) {
        // ✅ ถ้ามี Role: จับทุกอันมาต่อกันด้วยเครื่องหมาย " | "
        // เช่น Azure ส่งมา ["Viewer", "ChiangMai_Admin"]
        // ผลลัพธ์จะเป็น: "Viewer | ChiangMai_Admin"
        finalDisplayRole = rolesFromAzure.join(" | ");
    } else {
        // ❌ ถ้าไม่มี Role อะไรเลย: ให้ตั้งเป็นค่า Default
        finalDisplayRole = "General User"; 
    }

    console.log("✅ User Role Detected:", finalDisplayRole);

    return {
        name: name,
        displayRole: finalDisplayRole // ส่งค่านี้ออกไปแสดงผล
    };

  }, [activeAccount]);

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

  useEffect(() => {
    let interval;
    if (isPlaying && menuList.length > 0) {
      interval = setInterval(() => {
        setAutoPlayCountdown(prev => {
            // ถ้านับถึง 0 แล้ว ให้ค้างไว้ที่ 0 เพื่อรอ Effect อื่นมาทำงาน
            if (prev <= 0) return 0; 
            return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, menuList]);
  useEffect(() => {
    if (isPlaying && autoPlayCountdown === 0) {
        
        // สั่งเปลี่ยนหน้า
        setActivePageId((currentId) => {
            let currentIndex = menuList.findIndex(item => item.id === currentId);
            
            // 🛡️ กันพลาด: ถ้าหาหน้าปัจจุบันไม่เจอ ให้เริ่มที่หน้าแรก (0)
            if (currentIndex === -1) currentIndex = 0;

            // คำนวณหน้าถัดไป (แบบเรียงลำดับแน่นอน)
            const nextIndex = (currentIndex + 1) % menuList.length;
            
            console.log(`Auto-Play: Moving to page index ${nextIndex}`); // เช็คใน Console ได้
            return menuList[nextIndex].id;
        });

        // รีเซ็ตเวลากลับไปเริ่มต้นทันที
        setAutoPlayCountdown(TIMER_DURATION);
    }
  }, [autoPlayCountdown, isPlaying, menuList, TIMER_DURATION]);

  useEffect(() => {
    let timer;
    // เงื่อนไข: ถ้ากล่องเปิดอยู่ + มีเวลาเหลือ + และไม่ได้เอาเมาส์ชี้ไว้
    if (isSummaryExpanded && summaryAutoClose > 0 && !isHoveringSummary) {
      timer = setTimeout(() => {
        setSummaryAutoClose(prev => prev - 1);
      }, 1000);
    } 
    else if (summaryAutoClose === 0 && isSummaryExpanded) {
      // หมดเวลา -> สั่งพับกล่องทันที
      setSummaryExpanded(false);
    }
    return () => clearTimeout(timer);
  }, [summaryAutoClose, isSummaryExpanded, isHoveringSummary]);
  
  useEffect(() => {
    // เรียกครั้งแรกทันที
    generateLiveNews();

    const interval = setInterval(() => {
        generateLiveNews();
    }, 20000); // เปลี่ยนข่าวทุก 20 วินาที

    return () => clearInterval(interval);
  }, []);
  
  // Logic Login / Loading ...
  useEffect(() => {
    if (isAuthenticated) {
        const timer = setTimeout(() => { setAppReady(true); }, 2500); 
        return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

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

  // Helper Functions ...
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
      } catch (error) { handleAiSpeak("ขออภัย ระบบขัดข้อง", true); } 
      finally { setProcessing(false); }
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
        // ... (Logic เดิม) ...
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
        let allDataText = `ข้อมูลหน้า ${activePage.displayName}:\n`;
        let foundUpdateDate = null;

        for (const visual of visuals) {
            if (visual.title && visual.type !== 'image' && visual.type !== 'textbox') {
                try {
                    const result = await visual.exportData(models.ExportDataType.Summarized);
                    allDataText += `\n- ${visual.title}:\n${result.data}\n`;
                    if (visual.title === "LastUpdate") {
                        const lines = result.data.split('\n');
                        if (lines.length >= 2) foundUpdateDate = lines[1].trim();
                    }
                } catch (e) { /* ignore */ }
            }
        }
        
        setCurrentReportData(allDataText);
        summarizedPageRef.current = activePageId; 
        if(foundUpdateDate) setLastUpdated(foundUpdateDate);
        else setLastUpdated(new Date().toLocaleDateString('th-TH') + " (App Time)");

        const token = await getToken(); 
        const aiRes = await dashboardService.chat("ช่วยสรุป Executive Summary จากข้อมูลนี้", allDataText, langRef.current, token);
        setSummary(aiRes.message);
        setSummaryExpanded(true);
        setSummaryAutoClose(20);

        dashboardService.chat(
            "จากข้อมูลนี้ มีจุดไหนที่ตัวเลขดู 'วิกฤต' หรือ 'น่าเป็นห่วง' ไหม? ขอสั้นๆ 1 ประโยค ถ้าไม่มีให้ตอบว่า 'สถานการณ์ปกติ'", 
            allDataText, langRef.current, token
        ).then(res => {
            if (!res.message.includes("ปกติ")) addNotification('alert', 'พบสิ่งผิดปกติ!', res.message);
            else addNotification('info', 'AI Insight', 'สถานการณ์โดยรวมปกติดีครับ');
        });

    } catch (err) { setSummary("อ่านข้อมูลไม่ได้"); } 
    finally { setSummaryLoading(false); }
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

  const currentPage = menuList.find(p => p.id === activePageId);

  return (
    <DashboardLayout
      user={{ 
        name: userInfo.name, 
        role: userInfo.displayRole, 
        avatar: userAvatar 
      }}
      isSidebarCollapsed={isSidebarCollapsed}
      toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
      scrollRef={scrollRef} 
      onSearch={handleHeaderSearch}
      pageTitle={currentPage ? currentPage.title : "Smart Dashboard"}
      lastUpdated={lastUpdated}
      notifications={notifications}
      // ⭐ ส่งสถานะการเล่นและปุ่มกดไปให้ Layout
      isPlaying={isPlaying}
      togglePlay={() => setIsPlaying(!isPlaying)}
      autoPlayCountdown={autoPlayCountdown}
      
      summaryWidget={
        <div className={`ai-summary-wrapper ${isSummaryExpanded ? 'expanded' : 'collapsed'}`}
            onMouseEnter={() => setIsHoveringSummary(true)} // เมาส์เข้า -> หยุดนับ
            onMouseLeave={() => setIsHoveringSummary(false)} // เมาส์ออก -> นับต่อ
        >
            <ResultBox 
              text={summary} 
              isExpanded={isSummaryExpanded} 
              toggleExpand={() => {
                // ถ้า "กำลังจะเปิด" (ตอนนี้ปิดอยู่) -> ให้เติมเวลาเข้าไปใหม่ (เช่น 20 วิ)
                if (!isSummaryExpanded) {
                    setSummaryAutoClose(20); 
                }
                // สลับสถานะ เปิด/ปิด ตามปกติ
                setSummaryExpanded(!isSummaryExpanded);
              }}
              isLoading={isSummaryLoading} 
              onRefresh={handleManualRefresh} 
              autoCloseTimer={summaryAutoClose}
              isHovering={isHoveringSummary}
            />
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
      theme={theme}
      toggleTheme={toggleTheme}
      newsText={tickerText} // 👈 ส่งไป
      newsType={tickerType} // 👈 ส่งไป
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