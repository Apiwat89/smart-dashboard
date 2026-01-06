import React, { useState, useEffect, useRef, useMemo } from 'react';
import './App.css';
import { Dashboard, models } from 'powerbi-client';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import DashboardLayout from './components/Layout/DashboardLayout';
import LoadingScreen from './components/Layout/LoadingScreen';
import RealPowerBIEmbed from './components/Widgets/PowerBIEmbed'; 
import ResultBox from './components/Widgets/ResultBox';
import LoginPage from './components/Layout/LoginPage';
import { dashboardService } from './api/apiClient';

function App() {
    // --- State & Hooks ---
    const [tickerText, setTickerText] = useState("กำลังเชื่อมต่อ Power BI...");
    const [tickerType, setTickerType] = useState("info");
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const [isAppReady, setAppReady] = useState(false);
    const [userAvatar, setUserAvatar] = useState(null);
    const [rightPanelWidth, setRightPanelWidth] = useState(380);
    const isResizing = useRef(false);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [menuList, setMenuList] = useState([]);
    const [activePageId, setActivePageId] = useState("page_overview");
    const [isPlaying, setIsPlaying] = useState(false);
    const [autoPlayCountdown, setAutoPlayCountdown] = useState(120);
    const TIMER_DURATION = 120; 
    const [lang, setLang] = useState('TH');
    const [aiState, setAiState] = useState({ status: 'idle', message: '', isVisible: false });
    const [isProcessing, setProcessing] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [question, setQuestion] = useState("");
    const [suggestedQuestions, setSuggestedQuestions] = useState([]);
    const [currentReportData, setCurrentReportData] = useState(null);
    const [summary, setSummary] = useState("รอข้อมูลจาก Power BI...");
    const [isSummaryLoading, setSummaryLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isUnauthorized, setIsUnauthorized] = useState(false);
    const [showStartButton, setShowStartButton] = useState(false);
    const [ClientID, setClientID] = useState(null);

    // Refs
    const scrollRef = useRef(null); 
    const talkTimerRef = useRef(null);
    const powerBIReportRef = useRef(null);    
    const langRef = useRef(lang);
    const summarizedPageRef = useRef(null);

    const isAiBusy = aiState.status !== 'idle' || isProcessing;

    // --- Logic ---
    const activeAccount = accounts[0];
    const userInfo = useMemo(() => {
        if (!activeAccount) return { name: "Guest", displayRole: "Guest" };
        const name = activeAccount.name || "User";
        const rolesFromAzure = activeAccount.idTokenClaims?.roles || [];
        let finalDisplayRole = rolesFromAzure.length > 0 ? rolesFromAzure.join(" | ") : "General User";
        return { name: name, displayRole: finalDisplayRole };
    }, [activeAccount]);

    // --- Effects ---

    useEffect(() => {
        const fetch = async () => {
            const res = await dashboardService.getClientID();
            if (res) setClientID(res);
        }; fetch();
    }, []);

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

    useEffect(() => {
      const appMenu = [
        { id: "page_overview", title: "สถิติน้ำท่วม 1", type: "powerbi_page", icon: "LayoutDashboard", pageName: "798ca254819667030432" },
        { id: "page_details", title: "สถิติน้ำท่วม 2", type: "powerbi_page", icon: "Map", pageName: "5b3cc48690823dd3da6d" },
        { id: "page_analysis", title: "สถิติน้ำท่วม 3", type: "powerbi_page", icon: "BarChart", pageName: "e93c812d89901cad35c2" }
      ];
      setMenuList(appMenu);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            const timer = setTimeout(() => { 
                setShowStartButton(true); 
            }, 5500); 
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated]);

    useEffect(() => {
      const fetchProfilePhoto = async () => {
        if (!isAuthenticated || !activeAccount) return;
        try {
          const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: activeAccount, scopes: ["User.Read"] });
          const response = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
            headers: { Authorization: `Bearer ${tokenResponse.accessToken}` }
          });
          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setUserAvatar(url);
          }
        } catch (error) { console.error("Error fetching profile photo:", error); }
      };
      fetchProfilePhoto();
    }, [isAuthenticated, activeAccount, instance]);

    useEffect(() => {
        let interval;
        if (isPlaying && menuList.length > 0) {
          if (isAiBusy) {
              // ถ้ายุ่ง ให้หยุดนับ (Reset เวลา)
              setAutoPlayCountdown(TIMER_DURATION);
          } else {
              // ถ้าว่าง ให้นับต่อ
              interval = setInterval(() => {
                setAutoPlayCountdown(prev => (prev <= 0 ? 0 : prev - 1));
              }, 1000);
          }
        }
        return () => clearInterval(interval);
    }, [isPlaying, menuList, isAiBusy, TIMER_DURATION]);

    useEffect(() => {
        if (isPlaying && autoPlayCountdown === 0) {
            stopAllVoices();
            setActivePageId((currentId) => {
                const currentIndex = menuList.findIndex(item => item.id === currentId);
                const nextIndex = (currentIndex + 1) % menuList.length;
                return menuList[nextIndex].id;
            });
            setAutoPlayCountdown(TIMER_DURATION);
        }
    }, [autoPlayCountdown, isPlaying, menuList, TIMER_DURATION]);

    // ✅ Effect สำหรับเปลี่ยนภาษา: ทำงานเมื่อค่า lang เปลี่ยน โดยใช้ข้อมูลเดิม
    useEffect(() => {
        const refreshQuestionsOnLangChange = async () => {
            // 1. ถ้าไม่มีข้อมูลกราฟ (แปลว่ายังไม่ได้โหลดหน้า) ก็ไม่ต้องทำอะไร
            if (!currentReportData) return;

            const token = await getToken();
            const prompt = "Suggest 10 short important questions about this data, separated by newlines.";
            
            setTickerText("AI กำลังประเมินสถานการณ์...");

            try {
                // (Optional) เคลียร์คำถามเก่าก่อนเพื่อให้ User รู้ว่ากำลังคิดใหม่
                setSuggestedQuestions([]); 

                // 3. 🔥 ยิง API chat ด้วยข้อมูลเดิม (currentReportData) + ภาษาใหม่ (lang)
                const res = await dashboardService.chat(prompt, currentReportData, lang, token);
                
                // 4. แปลงผลลัพธ์เป็นรายการคำถาม
                const questions = res.message
                    .split('\n')
                    .map(q => q.replace(/^\d+\.\s*/, '').replace(/^- /, '').trim())
                    .filter(q => q.length > 5)
                    .slice(0, 10);

                // 5. อัปเดต State เพื่อโชว์คำถามภาษาใหม่
                setSuggestedQuestions(questions);

                const tickerRes = await dashboardService.getNewsTicker(currentReportData, lang, token);
                if (tickerRes && tickerRes.message) {
                    let rawMsg = tickerRes.message;
                    const upperMsg = rawMsg.toUpperCase(); // แปลงเป็นตัวพิมพ์ใหญ่เพื่อเช็ค Tag

                    if (upperMsg.startsWith("ALERT:")) {
                        setTickerType('alert');
                        // ตัด Tag ออกโดยไม่สนตัวพิมพ์เล็กใหญ่
                        setTickerText(rawMsg.replace(/^ALERT:/i, "").trim());
                    } else {
                        setTickerType('info');
                        // ตัด Tag INFO: ออก (ถ้ามี)
                        setTickerText(rawMsg.replace(/^INFO:/i, "").trim());
                    }
                }

            } catch (err) {
                console.error("Error refreshing questions on language change:", err);
                // กรณี Error อาจจะใส่คำถาม Default ไว้กันเหนียว
                setSuggestedQuestions(lang === 'EN' ? ["Analyzing data..."] : ["กำลังประมวลผลข้อมูล..."]);
            }
        };

        refreshQuestionsOnLangChange();

    }, [lang]); // 👈 สำคัญมาก! บรรทัดนี้สั่งให้รันทุกครั้งที่ "lang" เปลี่ยน

    const handleMenuChange = (id) => {
        setActivePageId(id);
        if (isPlaying) setAutoPlayCountdown(TIMER_DURATION);
    };

    // --- Handlers ---
    const startResizing = (e) => {
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

    const getToken = async () => {
        if (!activeAccount) return null;
        try {
            const response = await instance.acquireTokenSilent({ ...loginRequest, account: activeAccount });
            return response.accessToken;
        } catch (error) { return null; }
    };

    const stopAllVoices = () => {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (talkTimerRef.current) {
            clearTimeout(talkTimerRef.current);
            talkTimerRef.current = null;
        }
    };

    // 🔥 แก้ไข 1: ฟังก์ชันสั่งพูดเหลือแค่นี้พอ
    const handleAiSpeak = (text, isError = false) => {
      stopAllVoices(); 
      if (isError) {
          setAiState({ status: 'error', message: text, isVisible: true });
          return;
      }
      setAiState({ status: 'talking', message: text, isVisible: true });
    };

    const triggerAiChat = async (textInput) => {
        if(!textInput || !textInput.trim()) return;
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
        } catch (error) { 
            setSummary("เกิดข้อผิดพลาด");
            handleAiSpeak("ระบบขัดข้อง", true); 
        } finally { 
            setProcessing(false); 
            setSummaryLoading(false); 
        }
    };

    const handlePowerBIClick = async (event) => {
      if (event.detail && event.detail.dataPoints && event.detail.dataPoints.length > 0 && !isProcessing) {
          const dp = event.detail.dataPoints[0];
          const category = dp.identity[0]?.equals || "Unknown";
          const value = dp.values[0]?.formattedValue || "N/A";
          const chartTitle = event.detail.visual.title || "กราฟ"; 

          setSummaryLoading(true);
          setSummary(""); 
          setProcessing(true);
          if (window.speechSynthesis) window.speechSynthesis.cancel();
          setAiState({ status: 'thinking', message: '', isVisible: true });

          try {
              const token = await getToken(); 
              const res = await dashboardService.getReaction({ name: category, uv: value }, chartTitle, langRef.current, token);
              setSummary(res.message); 
              handleAiSpeak(res.message);
          } catch (error) {
              setSummary("ไม่สามารถวิเคราะห์จุดที่เลือกได้");
              handleAiSpeak("ขออภัยค่ะ ข้อมูลส่วนนี้ขัดข้อง", true);
          } finally {
              setProcessing(false);
              setSummaryLoading(false);
          }
      }
    };

    const handleReportRendered = async () => {
        if (!powerBIReportRef.current) return;
        const activePage = menuList.find(p => p.id === activePageId);
        if (summarizedPageRef.current === activePageId) return;

        // 🔥 แก้ไข 2: สั่งใบ้กิน + ทำท่าคิด ทันทีที่เริ่มเปลี่ยนหน้า เพื่อแก้เสียงซ้อน
        setAiState(prev => ({ ...prev, status: 'thinking', message: '' }));
        stopAllVoices();

        setSummaryLoading(true);
        setSummary("กำลังอ่านข้อมูล...");

        try {
            const pages = await powerBIReportRef.current.getPages();
            const pbiPage = pages.find(p => p.isActive);
            if (!pbiPage) return;
            
            const visuals = await pbiPage.getVisuals();
            let allDataText = `ข้อมูลหน้า ${activePage?.title}:\n`;
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

            const aiRes = await dashboardService.getSummary(allDataText, lang, token);
            setSummary(aiRes.message); 
            setTimeout(() => {
                handleAiSpeak(aiRes.message);
            }, 2000);

            // (ส่วนแนะนำคำถามและ Ticker คงเดิม)
            const suggestPrompt = "Suggest 10 short important questions about this data, separated by newlines.";
            const suggestRes = await dashboardService.chat(suggestPrompt, allDataText, langRef.current, token);
            const questions = suggestRes.message.split('\n').map(q => q.replace(/^\d+\.\s*/, '').trim()).filter(q => q.length > 5).slice(0, 10);
            setSuggestedQuestions(questions);
            setTickerText("AI กำลังประเมินสถานการณ์...");
            const tickerRes = await dashboardService.getNewsTicker(allDataText, langRef.current, token);
            if (tickerRes && tickerRes.message) {
                let rawMsg = tickerRes.message;
                const upperMsg = rawMsg.toUpperCase(); // แปลงเป็นตัวพิมพ์ใหญ่เพื่อเช็ค Tag

                if (upperMsg.startsWith("ALERT:")) {
                    setTickerType('alert');
                    // ตัด Tag ออกโดยไม่สนตัวพิมพ์เล็กใหญ่
                    setTickerText(rawMsg.replace(/^ALERT:/i, "").trim());
                } else {
                    setTickerType('info');
                    // ตัด Tag INFO: ออก (ถ้ามี)
                    setTickerText(rawMsg.replace(/^INFO:/i, "").trim());
                }
            }
        } catch (err) { 
            console.error(err);
            setTickerText("ระบบข่าวขัดข้อง");
        } finally { 
            setSummaryLoading(false); 
        }
    };

    const handleSpeechEnd = React.useCallback(() => {
        setAiState(prev => ({ ...prev, status: 'idle' }));
    }, []);

    const handleLogin = () => instance.loginRedirect(loginRequest);

    const handleStartApp = () => {
        setShowStartButton(false);
        setAppReady(true);
    };

    const handleLogout = () => {
        stopAllVoices(); 
        localStorage.clear(); sessionStorage.clear();
        const currentUrl = window.location.origin;
        instance.logoutRedirect({ postLogoutRedirectUri: currentUrl, account: activeAccount })
        .catch(e => { window.location.href = currentUrl; });
    };
    const handleHeaderSearch = (text) => { setQuestion(text); triggerAiChat(text); };

    if (!isAuthenticated) return <LoginPage onLogin={handleLogin} />;
    if (!isAppReady) {
        return (
            <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
                {/* โชว์ Loading Screen เป็นพื้นหลังไว้ก่อน */}
                <LoadingScreen /> 
                
                {/* ถ้าโหลดเสร็จแล้ว (ครบ 5.5 วิ) ให้ขึ้นปุ่มกด */}
                {showStartButton && (
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.4)', // ฉากดำจางๆ
                        zIndex: 10000,
                        animation: 'fadeIn 0.5s'
                    }}>
                        <button 
                            onClick={handleStartApp}
                            style={{
                                padding: '15px 40px',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: 'white',
                                background: 'linear-gradient(135deg, #00c49f 0%, #0078d4 100%)',
                                border: 'none',
                                borderRadius: '50px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                transition: 'transform 0.2s',
                            }}
                            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                        >
                            คลิกเพื่อเข้าสู่ระบบ
                        </button>
                    </div>
                )}
            </div>
        );
    }
    if (isUnauthorized) return <div className="access-denied-overlay">...</div>;

    const currentPage = menuList.find(p => p.id === activePageId);

    return (
        <DashboardLayout
            menuItems={menuList}
            activePageId={activePageId}
            onMenuClick={handleMenuChange}
            onLogout={handleLogout} 
            rightPanelWidth={rightPanelWidth}
            onResizerMouseDown={startResizing}
            user={{ name: userInfo.name, role: userInfo.displayRole, avatar: userAvatar }}
            isSidebarCollapsed={isSidebarCollapsed}
            toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
            scrollRef={scrollRef} 
            onSearch={handleHeaderSearch}
            pageTitle={currentPage ? currentPage.title : "Smart Dashboard"}
            notifications={notifications}
            isPlaying={isPlaying}
            togglePlay={() => setIsPlaying(!isPlaying)}
            autoPlayCountdown={autoPlayCountdown}
            theme={theme}
            isTimerWaiting={isAiBusy}
            toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
            newsText={tickerText}
            newsType={tickerType}
            rightPanelProps={{
                aiState: { ...aiState, isVisible: (aiState.status === 'talking' || aiState.status === 'thinking') ? true : aiState.isVisible },
                countdown,
                closeAi: () => setAiState(p => ({ ...p, isVisible: false, status: 'idle' })),
                userQuestion: question, 
                setUserQuestion: setQuestion, 
                handleAsk: (e) => { e.preventDefault(); triggerAiChat(question); setQuestion(""); },
                currentLang: lang, 
                setCurrentLang: setLang, 
                isProcessing,
                onSpeechEnd: handleSpeechEnd,
                suggestedQuestions: suggestedQuestions,
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
                      ClientID={ClientID}
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}

export default App;