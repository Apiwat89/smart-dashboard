import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './App.css';
import { Dashboard, models } from 'powerbi-client';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import DashboardLayout from './components/Layout/DashboardLayout';
import LoadingScreen from './components/Layout/LoadingScreen';
import RealPowerBIEmbed from './components/Widgets/PowerBIEmbed'; 
import ResultBox from './components/Widgets/ResultBox';
import LoginPage from './components/Layout/LoginPage';
import { dashboardService } from './api/apiClient';

// --- Global Variables & Constants ---

// ตัวแปรเก็บ Cache ระดับ Global (ไม่หายเมื่อ Re-render)
const dashboardCache = {};

// รายการเมนูหลักของระบบ
const APP_MENU = [
    // icon สามารถดูได้ที่นี่ https://fonts.google.com/icons?icon.size=24&icon.color=%231f1f1f&icon.platform=web 
    { 
        id: "one", 
        title: "สถิติจังหวัด", 
        headerTitle: "สถิติน้ำท่วมในแต่ละจังหวัด", 
        icon: <i class="material-symbols-outlined">partner_heart</i>, 
        pageName: "e6907073c19777d691e2" 
    }, // หากมีหลายหน้า ให้เพิ่ม object ในรูปแบบเดียวกันนี้ลงไปใน Array เช่น 
    // { id: "two", 
    //  title: "หน้า 2", 
    //  headerTitle: "ข้อมูลหน้า 2", 
    //  icon: <i class="material-symbols-outlined">analytics</i>, 
    //  pageName: "xxxxxx" 
    // },
];

function App({ loginRequest, powerBIRequest, TokenID }) {

    // --- 1. Authentication & User State ---
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const activeAccount = accounts[0];
    const [isUnauthorized, setIsUnauthorized] = useState(false);
    const [userAvatar, setUserAvatar] = useState(null);
    const [ClientID, setClientID] = useState(null);

    // --- 2. UI & Layout State ---
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [isAppReady, setAppReady] = useState(false);
    const [showStartButton, setShowStartButton] = useState(false);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [rightPanelWidth, setRightPanelWidth] = useState(window.innerWidth > 2500 ? 1500 : 380);
    const isResizing = useRef(false);

    // --- 3. Dashboard Control State ---
    const [activePageId, setActivePageId] = useState(APP_MENU[0].id);
    const [pbiLastUpdate, setPbiLastUpdate] = useState("อัพเดตล่าสุด...");
    const [currentReportData, setCurrentReportData] = useState(null);
    
    // --- 4. Player & Timer State ---
    const [isPlaying, setIsPlaying] = useState(false);
    const TIMER_DURATION = 600; 
    const [autoPlayCountdown, setAutoPlayCountdown] = useState(600);
    const [countdown, setCountdown] = useState(0);
    const [isGlobalMuted, setIsGlobalMuted] = useState(false);

    // --- 5. AI & Data State ---
    const [lang, setLang] = useState('TH');
    const [aiState, setAiState] = useState({ status: 'idle', message: '', isVisible: false });
    const [isProcessing, setProcessing] = useState(false);
    const [summary, setSummary] = useState("รอข้อมูลจาก Power BI...");
    const [isSummaryLoading, setSummaryLoading] = useState(false);
    const [isAudioReady, setIsAudioReady] = useState(false);
    
    // Chat & Questions
    const [question, setQuestion] = useState("");
    const [suggestedQuestions, setSuggestedQuestions] = useState([]);
    
    // Ticker News
    const [tickerText, setTickerText] = useState("กำลังเชื่อมต่อ Power BI...");
    const [tickerType, setTickerType] = useState("info");

    // --- 6. Refs ---
    const scrollRef = useRef(null); 
    const talkTimerRef = useRef(null);
    const powerBIReportRef = useRef(null);    
    const langRef = useRef(lang);
    const summarizedPageRef = useRef(null);
    const speechTimeoutRef = useRef(null);
    const lastInteractionRef = useRef(0);

    // คำนวณข้อมูลผู้ใช้งาน (Memoized)
    const userInfo = useMemo(() => {
        if (!activeAccount) return { name: "Guest", displayRole: "Guest" };
        const name = activeAccount.name || "User";
        const roles = activeAccount.idTokenClaims?.roles || [];
        return { name: name, displayRole: roles.length > 0 ? roles.join(" | ") : "General User" };
    }, [activeAccount]);

    const isAiBusy = aiState.status !== 'idle' || isProcessing;
    const currentPage = APP_MENU.find(p => p.id === activePageId);

    // --- Helper Functions ---

    // ฟังก์ชันขอ Token จาก Azure AD
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

    // ฟังก์ชันหยุดเสียงพูดและ Timer ทั้งหมด
    const stopAllVoices = useCallback(() => {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (talkTimerRef.current) {
            clearTimeout(talkTimerRef.current);
            talkTimerRef.current = null;
        }
        if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = null;
        }
    }, []);

    // ฟังก์ชันจัดการการพูดของ AI
    const handleAiSpeak = (text, isError = false) => {
        stopAllVoices(); 
        setIsAudioReady(false);
        if (isError) {
            setAiState({ status: 'error', message: text, isVisible: true });
            return;
        }
        setAiState({ status: 'talking', message: text, isVisible: true });
    };

    // ฟังก์ชันบันทึก Log การใช้งาน Cache ไปยัง Backend
    const logUsageToBackend = async (cachedData, actionType) => {
        
        const getTokens = (usage) => {
            if (!usage) return { input: 0, output: 0, total: 0 };
            return {
                input: usage.prompt_tokens || usage.input_tokens || 0,
                output: usage.completion_tokens || usage.output_tokens || 0,
                total: usage.total_tokens || 0
            };
        };

        let payload = {
            pageId: activePageId,
            lang: lang,
            action: actionType,
            startTime: cachedData.startTime || 0,
            endTime: cachedData.endTime || 0,
            processing: cachedData.originalTime || 0, 
            savedTime: cachedData.originalTime || 0,
        };

        if (actionType === 'summarize_view') {
            const t = getTokens(cachedData.summaryUsage); 
            payload = { 
                ...payload, 
                reqId: cachedData.reqId,
                input: cachedData.summaryPrompt, 
                output: cachedData.summary, 
                inputToken: t.input, 
                outputToken: t.output,
                totalToken: t.total, 
                savedTokens: t.total 
            };
        } else if (actionType === 'generate_questions') {
            const t = getTokens(cachedData.suggestionsUsage); 
            payload = { 
                ...payload, 
                reqId: cachedData.suggestionsReqId,
                input: cachedData.suggestionsPrompt, 
                output: cachedData.suggestions.join('\n'), 
                inputToken: t.input, 
                outputToken: t.output,
                totalToken: t.total, 
                savedTokens: t.total
            };
        } else if (actionType === 'generate_ticker') {
            const t = getTokens(cachedData.tickerUsage); 
            const prefix = cachedData.tickerType === 'alert' ? "ALERT: " : "INFO: ";
            payload = { 
                ...payload, 
                reqId: cachedData.tickerReqId,
                input: cachedData.tickerPrompt, 
                output: prefix + cachedData.tickerText, 
                inputToken: t.input, 
                outputToken: t.output,
                totalToken: t.total, 
                savedTokens: t.total
            };
        }

        await dashboardService.logCacheHit(payload);
    };

    // --- Event Handlers (Logic) ---

    // จัดการการย่อขยาย Sidebar
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
        const maxLimit = window.innerWidth > 2500 ? 5000 : 600; 
        if (newWidth > 240 && newWidth < maxLimit) {
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

    // จัดการเมื่อกดถาม Chat AI
    const triggerAiChat = async (textInput) => {
        if(!textInput || !textInput.trim()) return;
        const startLang = langRef.current;
        stopAllVoices();

        setIsAudioReady(false);
        setSummaryLoading(true); 
        setSummary(""); 
        setProcessing(true);
        setAiState({ status: 'thinking', message: '', isVisible: true });

        try {
            const token = await getToken(); 
            const res = await dashboardService.chat(textInput, currentReportData || "", langRef.current, token, activePageId); 

            if (startLang !== langRef.current) return;

            setSummary(res.message); 
            setProcessing(false);       
            setSummaryLoading(false);

            speechTimeoutRef.current = setTimeout(() => {
                if (startLang === langRef.current) handleAiSpeak(res.message);
            }, 300);
        } catch (error) { 
            setSummary("เกิดข้อผิดพลาด");
            handleAiSpeak("ระบบขัดข้อง", true); 
        } finally { 
            setProcessing(false); 
            setSummaryLoading(false); 
        }
    };

    // จัดการเมื่อคลิกที่จุดข้อมูลใน Power BI
    const handlePowerBIClick = async (event) => {
        lastInteractionRef.current = Date.now();
        if (event.detail?.dataPoints?.length > 0 && !isProcessing) {
            const startLang = langRef.current;
            const dp = event.detail.dataPoints[0];
            const category = dp.identity[0]?.equals || "Unknown";
            const value = dp.values[0]?.formattedValue || "N/A";
            const chartTitle = event.detail.visual.title || "กราฟ"; 

            setIsAudioReady(false);
            setSummaryLoading(true);
            setSummary(""); 
            setProcessing(true);
            stopAllVoices();
            setAiState({ status: 'thinking', message: '', isVisible: true });

            try {
                const token = await getToken(); 
                const res = await dashboardService.getReaction(
                    { name: category, uv: value }, chartTitle, langRef.current, token, activePageId
                );
                
                if (startLang !== langRef.current) return;

                setSummary(res.message); 
                speechTimeoutRef.current = setTimeout(() => {
                    if (startLang === langRef.current) handleAiSpeak(res.message);
                }, 300);

            } catch (error) {
                if (startLang === langRef.current) {
                    setSummary("ไม่สามารถวิเคราะห์จุดที่เลือกได้");
                    handleAiSpeak("ขออภัยครับ ข้อมูลส่วนนี้ขัดข้อง", true);
                }
            } finally {
                if (startLang === langRef.current) {
                    setProcessing(false);
                    setSummaryLoading(false);
                }
            }
        }
    };

    // จัดการเมื่อคลิกที่ตัว Visual (กราฟ) เพื่ออ่านข้อมูลทั้งกราฟ
    const handleVisualClick = async (event) => {
        lastInteractionRef.current = Date.now();
        const visualDescriptor = event.detail.visual;
        
        if (isProcessing) return;

        // กรอง Visual ที่ไม่ต้องการอ่าน
        const ignoreTypes = ['image', 'textbox', 'basicShape', 'shape', 'actionButton'];
        if (ignoreTypes.includes(visualDescriptor.type)) return;

        const startLang = langRef.current;

        try {
            setIsAudioReady(false);
            setSummaryLoading(true);
            setSummary("");
            setProcessing(true);
            setAiState({ status: 'thinking', message: 'Analyzing chart data...', isVisible: true });
    
            const report = powerBIReportRef.current;
            const pages = await report.getPages();
            const activePage = pages.find(p => p.isActive);
            const visuals = await activePage.getVisuals();
            const targetVisual = visuals.find(v => v.name === visualDescriptor.name);
    
            if (!targetVisual) throw new Error("Visual not found");
    
            let result;
            try {
                result = await targetVisual.exportData(models.ExportDataType.Summarized);
            } catch (err) {
                result = await targetVisual.exportData(models.ExportDataType.Underlying, { rows: 50 });
            }
    
            const token = await getToken(); 
            const res = await dashboardService.getReaction(null, result.data, langRef.current, token, activePageId);
            
            if (startLang !== langRef.current) return;

            setSummary(res.message);
            setProcessing(false);
            setSummaryLoading(false);

            speechTimeoutRef.current = setTimeout(() => {
                if (startLang === langRef.current) handleAiSpeak(res.message);
            }, 300);
    
        } catch (error) {
            if (error.message?.includes("Invalid export")) {
                 setSummary("กราฟชนิดนี้ไม่รองรับการอ่านข้อมูลครับ");
            } else {
                 setSummary("ไม่สามารถอ่านข้อมูลจากกราฟนี้ได้ครับ");
            }
        } finally {
            setProcessing(false);
            setSummaryLoading(false);
        }
    };

    // ฟังก์ชันหลัก: ดึงข้อมูลและสร้างสรุปหน้า Dashboard
    const handleReportRendered = async () => {
        // ป้องกันการทำงานซ้ำซ้อนถ้าผู้ใช้เพิ่งคลิกไป
        if (Date.now() - lastInteractionRef.current < 3000) return;
        
        stopAllVoices();
        if (!powerBIReportRef.current || isProcessing) return;

        const currentLang = langRef.current;
        const cacheKey = `${activePageId}_${currentLang}`;
        
        setIsAudioReady(false);

        // 1. ตรวจสอบ Cache
        if (dashboardCache[cacheKey]) {
            const cached = dashboardCache[cacheKey];
            setSummary(cached.summary);
            setSuggestedQuestions(cached.suggestions);
            setTickerText(cached.tickerText);
            setTickerType(cached.tickerType);
            setCurrentReportData(cached.rawData);
            setPbiLastUpdate(cached.lastUpdate || ""); 
            summarizedPageRef.current = activePageId;
            
            speechTimeoutRef.current = setTimeout(() => handleAiSpeak(cached.summary), 500);

            // ส่ง Log การใช้ Cache ไป Backend
            await logUsageToBackend(cached, 'summarize_view');
            if (cached.suggestionsReqId) await logUsageToBackend(cached, 'generate_questions');
            if (cached.tickerReqId) await logUsageToBackend(cached, 'generate_ticker');
            
            return;
        }

        // 2. ถ้าไม่มี Cache: ดึงข้อมูลใหม่
        summarizedPageRef.current = activePageId; 
        setAiState(prev => ({ ...prev, status: 'thinking', message: '' }));
        setSummaryLoading(true);

        try {
            const report = powerBIReportRef.current;
            const pages = await report.getPages();
            const pbiPage = pages.find(p => p.isActive);
            const visuals = await pbiPage.getVisuals();
            const activePageObj = APP_MENU.find(p => p.id === activePageId);

            // ดึงเวลาอัพเดต
            let formattedDate = "";
            const timeVisual = visuals.find(v => v.title === 'System_Time_Stamp');
            if (timeVisual) {
                try {
                    const timeResult = await timeVisual.exportData(models.ExportDataType.Summarized);
                    formattedDate = timeResult.data.replace(/^[^\d]+/, "").replace(/\n/g, "").trim();
                } catch (e) {}
            }
            if (!formattedDate) {
                const now = new Date();
                formattedDate = now.toLocaleDateString('th-TH') + " " + now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            }
            setPbiLastUpdate(formattedDate);

            // รวบรวมข้อมูลจากกราฟทั้งหมด
            let allDataText = `ข้อมูลหน้า ${activePageObj?.title || 'ปัจจุบัน'} (อัปเดตเมื่อ: ${formattedDate}):\n`;
            for (const visual of visuals) {
                if (visual.title === 'System_Time_Stamp') continue;
                if (visual.title && visual.type !== 'image' && visual.type !== 'textbox') {
                    try {
                        const result = await visual.exportData(models.ExportDataType.Summarized);
                        // ข้อมูลที่ส่งไปให้ OpenAi ยิ่งเยอะ ค่า input Token ก็ยิ่งสูงนะค้าบบ คำนึงถึง model version ของ OpenAi ด้วยว่าเขารองรับได้มากน้อยแค่ไหน
                        const visualData = result.data.length > 20000 
                            ? result.data.substring(0, 20000) + "... (ตัดข้อมูลส่วนเกิน)" 
                            : result.data;
                        allDataText += `\n- ${visual.title}:\n${visualData}\n`;
                    } catch (e) {}
                }
            }

            const finalPayload = allDataText.substring(0, 25000);
            setCurrentReportData(finalPayload);
            
            const token = await getToken(); 
            const startTime = new Date().toISOString();
            const startTimeCal = Date.now();

            // เรียก API พร้อมกัน 3 ตัว
            const [summaryRes, suggestRes, tickerRes] = await Promise.all([
                dashboardService.getSummary(finalPayload, currentLang, token, activePageId),
                dashboardService.chat("Suggest 10 questions...", finalPayload, currentLang, token, activePageId),
                dashboardService.getNewsTicker(finalPayload, currentLang, token, activePageId)
            ]);

            const endTime = new Date().toISOString();
            const endTimeCal = Date.now();
            const duration = endTimeCal - startTimeCal;
            const finalQuestions = suggestRes.message.split('\n').filter(q => q.length > 5).slice(0, 10);
            const isAlert = tickerRes?.message?.toUpperCase().startsWith("ALERT:");
            const finalTickerText = tickerRes?.message?.replace(/^(ALERT:|INFO:)/i, "").trim() || "";

            // บันทึกลง Cache
            dashboardCache[cacheKey] = {
                summary: summaryRes.message,
                suggestions: finalQuestions,
                tickerText: finalTickerText,
                tickerType: isAlert ? 'alert' : 'info',
                rawData: currentReportData,
                
                // เก็บข้อมูล Usage สำหรับ Log
                reqId: summaryRes.id,
                summaryUsage: summaryRes.usage,
                startTime: startTime,
                endTime: endTime,
                originalTime: duration,
                summaryPrompt: summaryRes.input,

                suggestionsReqId: suggestRes.id,
                suggestionsUsage: suggestRes.usage,
                suggestionsPrompt: suggestRes.input,

                tickerReqId: tickerRes.id,
                tickerUsage: tickerRes.usage,
                tickerPrompt: tickerRes.input
            };
            
            setSummary(summaryRes.message);
            setSuggestedQuestions(finalQuestions);
            setTickerText(finalTickerText);
            setTickerType(isAlert ? 'alert' : 'info');
            
            speechTimeoutRef.current = setTimeout(() => handleAiSpeak(summaryRes.message), 1000);

        } catch (err) { 
            summarizedPageRef.current = null;
            if (err.response?.status === 413) {
                setSummary("ข้อมูลมีขนาดใหญ่เกินไป ระบบกำลังปรับจูนการดึงข้อมูล...");
            }
        } finally { 
            setSummaryLoading(false); 
        }
    };

    // --- Effects (Life Cycle) ---

    // 1. Initial Data Fetching
    useEffect(() => {
        const fetch = async () => {
            const res = await dashboardService.getClientID();
            if (res) setClientID(res);
        }; fetch();
    }, []);

    // 2. Check Authorization
    useEffect(() => {
        if (isAuthenticated && userInfo.displayRole === "General User") {
            setIsUnauthorized(true);
        }
    }, [isAuthenticated, userInfo]);

    // 3. Theme & Language Ref Update
    useEffect(() => { langRef.current = lang; }, [lang]);
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme); 
    }, [theme]);

    // 4. Auto-Start Timer
    useEffect(() => {
        if (isAuthenticated) {
            const timer = setTimeout(() => { 
                setShowStartButton(false); 
                setAppReady(true);
            }, 5500); 
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated]);

    // 5. Fetch Profile Photo
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
                    setUserAvatar(URL.createObjectURL(blob));
                }
            } catch (error) { console.error("Error fetching photo", error); }
        };
        fetchProfilePhoto();
    }, [isAuthenticated, activeAccount, instance, loginRequest]);

    // 6. Auto Play Logic
    useEffect(() => {
        let interval;
        if (isPlaying && APP_MENU.length > 0) {
          if (isAiBusy) {
              setAutoPlayCountdown(TIMER_DURATION);
          } else {
              interval = setInterval(() => {
                setAutoPlayCountdown(prev => (prev <= 0 ? 0 : prev - 1));
              }, 1000);
          }
        }
        return () => clearInterval(interval);
    }, [isPlaying, isAiBusy, TIMER_DURATION]);

    useEffect(() => {
        if (isPlaying && autoPlayCountdown === 0) {
            stopAllVoices();
            setActivePageId((currentId) => {
                const currentIndex = APP_MENU.findIndex(item => item.id === currentId);
                const nextIndex = (currentIndex + 1) % APP_MENU.length;
                return APP_MENU[nextIndex].id;
            });
            setAutoPlayCountdown(TIMER_DURATION);
        }
    }, [autoPlayCountdown, isPlaying, TIMER_DURATION, stopAllVoices]);

    // 7. Handle Language Change (Re-fetch AI)
    useEffect(() => {
        let isCurrentEffect = true;
        stopAllVoices();
        setAiState(prev => ({ ...prev, status: 'thinking', message: '' }));
        setIsAudioReady(false);

        const refreshAIContentOnLangChange = async () => {
            if (!currentReportData) return;
            const cacheKey = `${activePageId}_${lang}`;
            
            // Check Cache
            if (dashboardCache[cacheKey]) {
                const cached = dashboardCache[cacheKey];
                if (isCurrentEffect) {
                    setSummary(cached.summary);
                    setSuggestedQuestions(cached.suggestions);
                    setTickerText(cached.tickerText);
                    setTickerType(cached.tickerType);
                    speechTimeoutRef.current = setTimeout(() => {
                        if (isCurrentEffect) handleAiSpeak(cached.summary);
                    }, 500);
                    
                    // Log Usage
                    await logUsageToBackend(cached, 'summarize_view');
                    if (cached.suggestionsReqId) await logUsageToBackend(cached, 'generate_questions');
                    if (cached.tickerReqId) await logUsageToBackend(cached, 'generate_ticker');
                }
                return;
            }

            // Fetch New Data
            if (isCurrentEffect) {
                setSummaryLoading(true);
                setTickerText("AI กำลังอัปเดตภาษา...");
                setSuggestedQuestions([]);
            }

            try {
                const token = await getToken();
                if (!isCurrentEffect) return;

                const startTime = new Date().toISOString();
                const startTimeCal = Date.now();
                const [summaryRes, suggestRes, tickerRes] = await Promise.all([
                    dashboardService.getSummary(currentReportData, lang, token, activePageId),
                    dashboardService.chat("Suggest 10 questions...", currentReportData, lang, token, activePageId),
                    dashboardService.getNewsTicker(currentReportData, lang, token, activePageId)
                ]);

                const endTime = new Date().toISOString();
                const endTimeCal = Date.now();
                const duration = endTimeCal - startTimeCal;
                const questionsList = suggestRes.message.split('\n').filter(line => /^\d+\./.test(line.trim())).map(q => q.replace(/^\d+\.\s*/, '').trim()).slice(0, 10);
                const isAlert = tickerRes.message?.toUpperCase().startsWith("ALERT:");
                const cleanTicker = tickerRes.message?.replace(/^(ALERT:|INFO:)/i, "").trim();

                // Save to Cache
                dashboardCache[cacheKey] = {
                    summary: summaryRes.message,
                    suggestions: questionsList,
                    tickerText: cleanTicker,
                    tickerType: isAlert ? 'alert' : 'info',
                    rawData: currentReportData,
                    
                    reqId: summaryRes.id,
                    summaryUsage: summaryRes.usage,
                    startTime: startTime,
                    endTime: endTime,
                    originalTime: duration,
                    summaryPrompt: summaryRes.input,

                    suggestionsReqId: suggestRes.id,
                    suggestionsUsage: suggestRes.usage,
                    suggestionsPrompt: suggestRes.input,

                    tickerReqId: tickerRes.id,
                    tickerUsage: tickerRes.usage,
                    tickerPrompt: tickerRes.input
                };

                if (isCurrentEffect) {
                    setSummary(summaryRes.message);
                    setSuggestedQuestions(questionsList);
                    setTickerText(cleanTicker);
                    setTickerType(isAlert ? 'alert' : 'info');
                    speechTimeoutRef.current = setTimeout(() => {
                        if (isCurrentEffect) handleAiSpeak(summaryRes.message);
                    }, 1000);
                }
            } catch (err) { console.error(err); } 
            finally { if (isCurrentEffect) setSummaryLoading(false); }
        };

        refreshAIContentOnLangChange();
        return () => { isCurrentEffect = false; stopAllVoices(); };
    }, [lang]);

    // --- Main Render ---

    const isWaitingForAudio = aiState.status === 'talking' && !isAudioReady;
    const displayMessage = isWaitingForAudio ? "" : (aiState.status === 'talking' ? aiState.message : summary);
    const isShowLoading = isSummaryLoading || aiState.status === 'thinking' || isWaitingForAudio;

    const handleLogin = () => instance.loginRedirect(loginRequest);
    const handleLogout = () => {
        stopAllVoices(); 
        localStorage.clear(); sessionStorage.clear();
        const currentUrl = window.location.origin;
        instance.logoutRedirect({ postLogoutRedirectUri: currentUrl, account: activeAccount })
        .catch(e => { window.location.href = currentUrl; });
    };

    if (!isAuthenticated) return <LoginPage onLogin={handleLogin} />;
    
    if (isUnauthorized) {
        return (
            <div className='AccessDenied'>
                <h1>🚫 Access Denied</h1>
                <p>คุณไม่มีสิทธิ์เข้าใช้งานระบบ (Role: {userInfo.displayRole})</p>
                <button onClick={handleLogout}>ออกจากระบบ</button>
            </div>
        );
    } 

    if (!isAppReady) {
        return (
            <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
                <LoadingScreen /> 
                {showStartButton && (
                    <div className="start-button-overlay">
                        <button onClick={() => { setShowStartButton(false); setAppReady(true); }} className="start-button">
                            คลิกเพื่อเข้าสู่ระบบ
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <DashboardLayout
            // Layout Props
            user={{ name: userInfo.name, role: userInfo.displayRole, avatar: userAvatar }}
            pageTitle={currentPage ? (currentPage.headerTitle || currentPage.title) : "Smart Dashboard"}
            lastUpdated={pbiLastUpdate}
            
            // Sidebar Props
            menuItems={APP_MENU}
            activePageId={activePageId}
            onMenuClick={(id) => { setActivePageId(id); if (isPlaying) setAutoPlayCountdown(TIMER_DURATION); }}
            onLogout={handleLogout} 
            isSidebarCollapsed={isSidebarCollapsed}
            toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
            
            // Layout Controls
            rightPanelWidth={rightPanelWidth}
            onResizerMouseDown={startResizing}
            scrollRef={scrollRef} 
            theme={theme}
            toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}

            // Player Props
            isPlaying={isPlaying}
            togglePlay={() => setIsPlaying(!isPlaying)}
            autoPlayCountdown={autoPlayCountdown}

            // Search & News
            onSearch={(text) => { setQuestion(text); triggerAiChat(text); }}
            newsText={tickerText}
            newsType={tickerType}

            // Right Panel Content
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
                onSpeechEnd: () => setAiState(prev => ({ ...prev, status: 'idle' })),
                onSpeechStart: () => setIsAudioReady(true),
                suggestedQuestions: suggestedQuestions,
                onSelectQuestion: (q) => { setSummaryLoading(true); setSummary(""); triggerAiChat(q); },
                isGlobalMuted: isGlobalMuted,
                summaryWidget: (
                        <div className="ai-summary-in-panel">
                            <ResultBox 
                                text={displayMessage}
                                isLoading={isShowLoading}
                                onRefresh={() => { 
                                    const cacheKey = `${activePageId}_${lang}`;
                                    if (dashboardCache[cacheKey]) delete dashboardCache[cacheKey];
                                    setSummary("");
                                    setSuggestedQuestions([]);
                                    summarizedPageRef.current = null; 
                                    handleReportRendered(); 
                                }}
                                isMuted={isGlobalMuted}
                                toggleMute={() => setIsGlobalMuted(!isGlobalMuted)}
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

            {/* Test BigQuery */}
            {/* <div style={{
                position: 'fixed',     
                bottom: '20px',     
                left: '20px',
                zIndex: 999999,
                backgroundColor: 'rgba(0, 0, 0, 0.85)', 
                color: 'white',    
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                maxWidth: '300px',
                fontFamily: 'sans-serif'
            }}>
                <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #555', paddingBottom: '5px' }}>
                    🛠️ DEV DEBUGGER
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                        onClick={() => {
                            console.log("Token ID:", TokenID);
                            alert("Token logged to console! (กด F12 ดู)");
                        }}
                        style={{ cursor: 'pointer', padding: '5px' }}
                    >
                        Log Token ID
                    </button>

                    <button 
                        onClick={() => triggerAiChat("สรุปข้อมูลหน้านี้ให้หน่อย")}
                        style={{ cursor: 'pointer', padding: '5px' }}

                    >
                        Test BigQuery
                    </button>

                    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>
                        Page ID: {activePageId} <br/>
                        AI Status: {aiState.status}
                    </div>
                </div>
            </div> */}
        </DashboardLayout>
    );
}

export default App;