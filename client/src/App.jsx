import React, { useState, useEffect, useRef, useMemo } from 'react';
import './App.css';
import { Dashboard, models } from 'powerbi-client';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import DashboardLayout from './components/Layout/DashboardLayout';
import LoadingScreen from './components/Layout/LoadingScreen';
import RealPowerBIEmbed from './components/Widgets/PowerBIEmbed'; 
import ResultBox from './components/Widgets/ResultBox';
import LoginPage from './components/Layout/LoginPage';
import { dashboardService } from './api/apiClient';

const dashboardCache = {};

function App({ loginRequest, powerBIRequest, TokenID }) {
    // --- State & Hooks ---
    const [tickerText, setTickerText] = useState("กำลังเชื่อมต่อ Power BI...");
    const [pbiLastUpdate, setPbiLastUpdate] = useState("อัพเดตล่าสุด...");
    const [tickerType, setTickerType] = useState("info");
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const [isAppReady, setAppReady] = useState(false);
    const [userAvatar, setUserAvatar] = useState(null);
    const [rightPanelWidth, setRightPanelWidth] = useState(window.innerWidth > 2500 ? 1100 : 380);
    const isResizing = useRef(false);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [menuList, setMenuList] = useState([]);
    const [activePageId, setActivePageId] = useState("page_overview");
    const [isPlaying, setIsPlaying] = useState(false);
    const [autoPlayCountdown, setAutoPlayCountdown] = useState(600);
    const TIMER_DURATION = 600; 
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
        if (isAuthenticated & userInfo.displayRole === "General User") {
            setIsUnauthorized(true);
        }
    }, [isAuthenticated, userInfo]);

    useEffect(() => { langRef.current = lang; }, [lang]);
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme); 
    }, [theme]);

    useEffect(() => {
        const appMenu = [
            { 
            id: "page_overview", 
            title: "สถิติจังหวัด",             
            headerTitle: "สถิติน้ำท่วมในแต่ละจังหวัด", 
            icon: "LayoutDashboard", 
            pageName: "798ca254819667030432" 
            },
            { 
            id: "page_details", 
            title: "สถิติรายเดือน",            
            headerTitle: "สถิติน้ำท่วมของเดือนที่เกิดเหตุ", 
            icon: "Map", 
            pageName: "5b3cc48690823dd3da6d" 
            },
            { 
            id: "page_analysis", 
            title: "ความเสียหาย",              
            headerTitle: "ความเสียหายในแต่ละด้าน",   
            icon: "BarChart", 
            pageName: "e93c812d89901cad35c2" 
            }
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

    // Effect สำหรับเปลี่ยนภาษา: ทำงานเมื่อค่า lang เปลี่ยน โดยใช้ข้อมูลเดิม
    useEffect(() => {
        const refreshAIContentOnLangChange = async () => {
            if (!currentReportData) return;

            // 🟢 1. ตรวจสอบ Cache ก่อน
            const cacheKey = `${activePageId}_${lang}`;
            if (dashboardCache[cacheKey]) {
                console.log("🚀 [Cache Hit] เปลี่ยนภาษาแบบไม่ต้องยิง API:", cacheKey);
                const cached = dashboardCache[cacheKey];
                setSummary(cached.summary);
                setSuggestedQuestions(cached.suggestions);
                setTickerText(cached.tickerText);
                setTickerType(cached.tickerType);
                setTimeout(() => handleAiSpeak(cached.summary), 500);
                return; 
            }

            // 🔵 2. ถ้าไม่มี Cache ค่อยยิง API
            setSummaryLoading(true);
            setTickerText("AI กำลังอัปเดตภาษา...");
            setSuggestedQuestions([]);

            try {
                const token = await getToken();
                const [summaryRes, suggestRes, tickerRes] = await Promise.all([
                    dashboardService.getSummary(currentReportData, lang, token),
                    dashboardService.chat("Suggest 10 short important questions about this data, separated by newlines.", currentReportData, lang, token),
                    dashboardService.getNewsTicker(currentReportData, lang, token)
                ]);

                // จัดการคำถาม (ตัวแปรนี้แหละค่ะที่ตอนแรกมันหาไม่เจอ)
                const questionsList = suggestRes.message
                    .split('\n')
                    // กรองเอาเฉพาะบรรทัดที่ขึ้นต้นด้วยตัวเลข 1-9 หรือบรรทัดที่มีเครื่องหมายคำถาม เท่านั้น
                    .filter(line => /^\d+\./.test(line.trim())) 
                    .map(q => q.replace(/^\d+\.\s*/, '').trim())
                    .slice(0, 10);

                const isAlert = tickerRes.message.toUpperCase().startsWith("ALERT:");
                const cleanTicker = tickerRes.message.replace(/^(ALERT:|INFO:)/i, "").trim();

                // ✅ 3. บันทึกลง Cache (ใช้ชื่อตัวแปรที่ประกาศด้านบน)
                dashboardCache[cacheKey] = {
                    summary: summaryRes.message,
                    suggestions: questionsList, // 👈 ใช้ชื่อนี้ให้ตรงกัน
                    tickerText: cleanTicker,
                    tickerType: isAlert ? 'alert' : 'info',
                    rawData: currentReportData
                };

                // อัปเดต UI
                setSummary(summaryRes.message);
                setSuggestedQuestions(questionsList);
                setTickerText(cleanTicker);
                setTickerType(isAlert ? 'alert' : 'info');
                setTimeout(() => handleAiSpeak(summaryRes.message), 1000);

            } catch (err) {
                console.error("Error refreshing on lang change:", err);
            } finally {
                setSummaryLoading(false);
            }
        };

        refreshAIContentOnLangChange();
    }, [lang]);

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
        
        // 🚩 ขยายขีดจำกัดการลากให้กว้างขึ้นสำหรับจอ 4K
        const maxLimit = window.innerWidth > 2500 ? 1500 : 600; 
        
        if (newWidth > 200 && newWidth < maxLimit) {
            setRightPanelWidth(newWidth);
        }
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
            const response = await instance.acquireTokenSilent({ 
                account: activeAccount, 
                scopes: [`${TokenID}/.default`] 
            });
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

    const handleVisualClick = async (event) => {
        // 1. รับแค่ "ป้ายชื่อ" มาก่อน
        const visualDescriptor = event.detail.visual;
        console.log("🖱️ User clicked on:", visualDescriptor.name, visualDescriptor.type);
    
        if (isProcessing) return;

        // 🛑 เพิ่ม: ดักจับพวกที่ไม่ใช่กราฟ (เช่น รูปภาพ, กล่องข้อความ) จะได้ไม่ต้องเสียเวลาดึง
        const ignoreTypes = ['image', 'textbox', 'basicShape', 'shape', 'actionButton'];
        if (ignoreTypes.includes(visualDescriptor.type)) {
            return;
        }
    
        try {
            setSummaryLoading(true);  // สั่งให้กล่องข้อความหมุน
            setSummary("");           // ลบข้อความเก่าทิ้งไปก่อน

            setProcessing(true);
            setAiState({ status: 'thinking', message: 'Analyzing chart data...', isVisible: true });
    
            // 2. เริ่มปฏิบัติการ "ค้นหาตัวจริง"
            const report = powerBIReportRef.current;
            const pages = await report.getPages();
            const activePage = pages.find(p => p.isActive);
            const visuals = await activePage.getVisuals();
    
            // 3. หาตัวกราฟที่มีชื่อตรงกัน
            const targetVisual = visuals.find(v => v.name === visualDescriptor.name);
    
            if (!targetVisual) {
                throw new Error("❌ หาตัวกราฟจริงไม่เจอในหน้านี้");
            }
    
            // 4. สั่งดึงข้อมูลจากตัวจริง
            let result;
            try {
                // พยายามดึงข้อมูลสรุปก่อน (ใช้ models จะชัวร์กว่าพิมพ์ string เอง)
                result = await targetVisual.exportData(models.ExportDataType.Summarized);
                console.log("✅ Exported Summarized");
            } catch (err) {
                console.warn("Summarized failed, trying Underlying...");
                
                // 🟢 แก้ไขจุดสำคัญ: ต้องใส่ { rows: 100 } เพื่อจำกัดข้อมูล ไม่ให้โหลดหนักจนพัง
                result = await targetVisual.exportData(models.ExportDataType.Underlying, { rows: 50 });
                console.log("✅ Exported Underlying");
            }
    
            console.log("📦 Data exported:", result.data);
    
            // 5. ส่งข้อมูลไปให้ AI
            const token = await getToken(); 
            const res = await dashboardService.getReaction(null, result.data, lang, token);
            
            setSummary(res.message);
            handleAiSpeak(res.message);
    
        } catch (error) {
            console.error("🔥 Error exporting data:", error);
            
            // ดัก Error เฉพาะเคสที่เจอบ่อย
            if (error.message && error.message.includes("Invalid export data request")) {
                 setSummary("กราฟชนิดนี้ไม่รองรับการอ่านข้อมูลค่ะ");
            } else {
                 setSummary("ไม่สามารถอ่านข้อมูลจากกราฟนี้ได้ค่ะ");
            }

        } finally {
            setProcessing(false);
            setSummaryLoading(false); // อย่าลืมปิดตัวโหลด text ด้วย
        }
    };
      
    const handleReportRendered = async () => {
        if (!powerBIReportRef.current) return;

        const cacheKey = `${activePageId}_${lang}`;
        
         // 1. ตรวจสอบ Cache (เหมือนเดิม)
        if (dashboardCache[cacheKey]) {
            const cached = dashboardCache[cacheKey];
            setSummary(cached.summary);
            setSuggestedQuestions(cached.suggestions);
            setTickerText(cached.tickerText);
            setTickerType(cached.tickerType);
            setCurrentReportData(cached.rawData);
            setPbiLastUpdate(cached.lastUpdate || ""); 
            summarizedPageRef.current = activePageId;
            setTimeout(() => handleAiSpeak(cached.summary), 500);
            return;
        }
 
        summarizedPageRef.current = activePageId; 
        setAiState(prev => ({ ...prev, status: 'thinking', message: '' }));
        setSummaryLoading(true);
 
        try {
            const report = powerBIReportRef.current;
            // ดึง Pages มาก่อนเพื่อหา Active Page
            const pages = await report.getPages();
            const pbiPage = pages.find(p => p.isActive);
            // ดึง Visuals ทั้งหมดในหน้านี้มารอไว้เลย (ใช้ทั้งดึงเวลา และดึงข้อมูล)
            const visuals = await pbiPage.getVisuals();
            const activePage = menuList.find(p => p.id === activePageId);

            // =========================================================
            // 🟢 ส่วนแก้ไขใหม่: ดึงเวลาจาก Card ที่ชื่อ System_Time_Stamp
            // =========================================================
            let formattedDate = "";
                    
            // 1. ค้นหา Card ที่เราแอบสร้างไว้ใน Power BI Desktop
            const timeVisual = visuals.find(v => v.title === 'System_Time_Stamp');

            if (timeVisual) {
                try {
                    // ถ้าเจอ ให้ดึงข้อมูล text ข้างในออกมา
                    const timeResult = await timeVisual.exportData(models.ExportDataType.Summarized);
                    // ข้อมูลที่ได้มักจะมี \n ติดมา ให้ตัดทิ้ง
                    formattedDate = timeResult.data.replace(/^[^\d]+/, "").replace(/\n/g, "").trim();
                    console.log(`⏰ Time found in ${activePageId}:`, formattedDate);
                } catch (e) {
                    console.warn("Found time card but export failed:", e);
                }
            }

            // 2. Fallback: ถ้าหา Card ไม่เจอจริงๆ ให้ใช้เวลาปัจจุบัน (Render Time)
            if (!formattedDate) {
                    console.warn("System_Time_Stamp card not found. Using local time.");
                    const now = new Date();
                    formattedDate = now.toLocaleDateString('th-TH') + " " + 
                                    now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            }
 
            setPbiLastUpdate(formattedDate);
            // =========================================================
 
            // --- ส่วนดึงข้อมูล Visuals เพื่อส่ง AI (ปรับปรุงเล็กน้อย) ---
            let allDataText = `ข้อมูลหน้า ${activePage?.title || 'ปัจจุบัน'} (อัปเดตเมื่อ: ${formattedDate}):\n`;

            for (const visual of visuals) {
                // ข้ามตัวบอกเวลาที่เราสร้างเอง (ไม่ต้องส่งให้ AI ซ้ำ)
                if (visual.title === 'System_Time_Stamp') continue;

                if (visual.title && visual.type !== 'image' && visual.type !== 'textbox') {
                    try {
                        const result = await visual.exportData(models.ExportDataType.Summarized);
                        allDataText += `\n- ${visual.title}:\n${result.data}\n`;
                    } catch (e) { console.warn(`Export failed for ${visual.title}`, e); }
                }
            }
 
            setCurrentReportData(allDataText);
            const token = await getToken(); 
 
            const [summaryRes, suggestRes, tickerRes] = await Promise.all([
                dashboardService.getSummary(allDataText, lang, token),
                dashboardService.chat("Suggest 10 short important questions...", allDataText, lang, token),
                dashboardService.getNewsTicker(allDataText, lang, token)
            ]);
 
            const finalQuestions = suggestRes.message.split('\n').filter(q => q.length > 5).slice(0, 10);
            const isAlert = tickerRes?.message?.toUpperCase().startsWith("ALERT:");
            const finalTickerText = tickerRes?.message?.replace(/^(ALERT:|INFO:)/i, "").trim() || "";
 
            // ✅ บันทึกลง Cache
            dashboardCache[cacheKey] = {
                summary: summaryRes.message,
                suggestions: finalQuestions,
                tickerText: finalTickerText,
                tickerType: isAlert ? 'alert' : 'info',
                rawData: allDataText,
                lastUpdate: formattedDate // บันทึกเวลาที่ถูกต้องลง Cache
            };
 
            setSummary(summaryRes.message);
            setSuggestedQuestions(finalQuestions);
            setTickerText(finalTickerText);
            setTickerType(isAlert ? 'alert' : 'info');
            setTimeout(() => handleAiSpeak(summaryRes.message), 2000);
 
        } catch (err) { 
            console.error("Report Rendered Error:", err);
            summarizedPageRef.current = null;
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
    
    if (isUnauthorized) {
        return (
            <div className='AccessDenied'>
                <h1>🚫 Access Denied</h1>
                <p>คุณไม่มีสิทธิ์เข้าใช้งานระบบ (Role: {userInfo.displayRole})</p>
                <p>กรุณาติดต่อผู้ดูแลระบบ เพื่อขอสิทธิ์ในการเข้าใช้งานระบบ</p>
                <button onClick={handleLogout}>ออกจากระบบ</button>
            </div>
        );
    } 

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
                                marginTop: '35%'
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

    const currentPage = menuList.find(p => p.id === activePageId);

    return (
        <DashboardLayout
            lastUpdated={pbiLastUpdate}
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
            pageTitle={currentPage ? (currentPage.headerTitle || currentPage.title) : "Smart Dashboard"}

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
                                onRefresh={() => { 
                                    const cacheKey = `${activePageId}_${lang}`;
                                    if (dashboardCache[cacheKey]) {
                                        delete dashboardCache[cacheKey];
                                    }
                                    
                                    // ล้างหน้าจอให้ขาวสะอาดก่อนโหลดใหม่
                                    setSummary("");
                                    setSuggestedQuestions([]);
                                    
                                    summarizedPageRef.current = null; 
                                    handleReportRendered(); 
                                }}
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
                      eventHandlers={new Map([['dataSelected', handlePowerBIClick], ['visualClicked', handleVisualClick]])}
                      getEmbeddedComponent={(report) => { powerBIReportRef.current = report; }}
                      onReportRendered={handleReportRendered}
                      ClientID={ClientID}
                      powerBIRequest={powerBIRequest}
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}

export default App;