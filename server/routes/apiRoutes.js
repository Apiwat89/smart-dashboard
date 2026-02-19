const express = require('express');
const router = express.Router();
const { generateAIResponse, logCacheHit} = require('../services/aiService');
const { generateGoogleSpeech } = require('../services/speechService');
const verifyToken = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { prompts } = require('./prompts');

// Helper Functions

// ฟังก์ชันเลือกคำสั่งภาษาสำหรับ AI
const getLangInstruction = (lang) => {
    switch (lang) {
        case 'CN': return "Respond in Simplified Chinese (Natural, Polite, Professional)."; 
        case 'KR': return "Respond in Korean (Natural, Polite, Professional)."; 
        case 'EN': return "Respond in English (Natural, Polite, Professional).";
        case 'JP': return "Respond in Japanese (Natural, Polite, Professional).";
        case 'VN': return "Respond in Vietnamese (Natural, Polite, Professional).";
        case 'TH': default: return "Respond in Thai (Natural, Polite, Professional).";
    }
};

// ฟังก์ชันดึงชื่อ Mascot ตามภาษา
const getMascotName = (lang) => {
    // สามารถปรับเปลี่ยนชื่อตามภาษาได้ที่นี่
    return "EZ"; 
};

// หน่วยความจำชั่วคราวสำหรับเก็บ Summary (In-Memory Store)
const summaryStore = {};

// --- API Endpoints ---

// 1. บันทึก Log การใช้งาน Cache
router.post('/log-cache', (req, res) => {
    const { reqId, pageId,savedTokens, processing, startTime, endTime, savedTime, lang, action, input, output, inputToken, outputToken, totalToken} = req.body; 
    logCacheHit({ reqId, pageId, savedTokens, processing, startTime, endTime, savedTime, lang, action, input, output, inputToken, outputToken, totalToken});
    res.json({ status: 'ok' });
});

// 2. ดึงการตั้งค่า Authentication
router.get('/auth-config', (req, res) => {
    try {
        res.json({
            clientId: process.env.AZURE_CLIENT_ID,
            authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Config Error"});
    }
});

// 3. ดึง Client ID ของ Power BI Report
router.get('/Client-ID', (req, res) => {
    try {
        const id = process.env.POWERBI_REPORT_ID;
        res.json(id);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Client ID not found"});
    }
})

// 4. สรุปข้อมูลกราฟ (AI Summarize)
router.post('/summarize-view', verifyToken, async (req, res) => {
    const { visibleCharts, lang, pageId } = req.body; 
    const langInstruction = getLangInstruction(lang);
    const mascotName = getMascotName(lang); 

    let prompt = prompts.getSummarize(mascotName, langInstruction, visibleCharts);

    try {
        const result = await generateAIResponse(prompt, {
            action: 'summarize_view',
            pageId: pageId,
            lang: lang,
        });

        res.json({ 
            message: result.text, 
            id: result.id, 
            usage: result.usage,
            input: result.input
        });
    } catch (err) {
        console.error("AI Error:", err);
        res.status(500).json({ message: "Analysis currently unavailable." });
    }
});

// 5. ปฏิกิริยาตัวละคร (Character Reaction)
router.post('/character-reaction', verifyToken, async (req, res) => {
    const { pointData, contextData, lang, pageId } = req.body; 
    const langInstruction = getLangInstruction(lang);
    const mascotName = getMascotName(lang); 

    let prompt = [];

    if (pointData) {
        // กรณี 1: จิ้มโดนจุดข้อมูล
        prompt = prompts.getCharacter(true, mascotName, pointData, contextData, langInstruction);
    } else {
        // กรณี 2: คลิกที่ตัวกราฟ
        prompt = prompts.getCharacter(false, mascotName, pointData, contextData, langInstruction);
    }

    try {
        const result = await generateAIResponse(prompt, {
            action: 'character_reaction',
            pageId: pageId,
            lang: lang
        });
        
        res.json({ 
            message: result.text,
            id: result.id,
            usage: result.usage,
            input: result.input
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to generate character reaction." });
    }
});

// 6. ระบบแชทถาม-ตอบ (Chat)
router.post('/ask-dashboard', verifyToken, async (req, res) => {
    const { question, allData, lang, pageId } = req.body;
    const langInstruction = getLangInstruction(lang);
    const mascotName = getMascotName(lang); 

    const actionType = question && question.includes("Suggest 10 questions") // ตรวจสอบคำถามที่ส่งมาจาก Client
        ? 'generate_questions' 
        : 'chat_ask';

    let prompt = [];

    if (actionType === 'generate_questions') {
        // กรณี 1: ให้แนะนำคำถาม 10 ข้อ 
        prompt = prompts.getAskGenerate(true, mascotName, allData, langInstruction, question);
    } else {
        // กรณี 2: ตอบคำถามจากข้อมูล
        prompt = prompts.getAskGenerate(false, mascotName, allData, langInstruction, question)
    }

    try {
        const result = await generateAIResponse(prompt, {
            action: actionType,
            pageId: pageId,
            lang: lang
        });

        res.json({ 
            message: result.text,
            id: result.id,
            usage: result.usage,
            input: result.input
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to generate AI response." });
    }
});

// 7. ขอ Token สังเคราะห์เสียง (Azure)
// router.get('/speech-azure', async (req, res) => {
//     try {
//         const data = await fetchAzureSpeechToken();
//         res.json(data);
//     } catch (err) {
//         res.status(500).json({ error: "Failed to fetch speech token" });
//     }
// });

router.post('/speech-google', async (req, res) => {
    try {
        const { text, lang } = req.body; // รับข้อความและภาษาจากหน้าเว็บ

        if (!text) {
            return res.status(400).json({ error: "No text provided" });
        }

        // โยนให้ Google แปลงเสียง
        const audioBase64 = await generateGoogleSpeech(text, lang);
        
        // ส่งไฟล์ MP3 (Base64) กลับไปให้หน้าเว็บ
        res.json({ audioContent: audioBase64 });
    } catch (err) {
        res.status(500).json({ error: "Failed to generate speech" });
    }
});

// router.post('/speech-gemini', async (req, res) => { 
//     try {
//         const { text, lang } = req.body;

//         if (!text) {
//             return res.status(400).json({ error: "No text provided" });
//         }

//         // โยนให้ Gemini แปลงเสียง
//         const audioBase64 = await generateGeminiSpeech(text, lang);
        
//         // ส่งไฟล์ WAV (Base64) กลับไปให้หน้าเว็บ
//         res.json({ audioContent: audioBase64 });
//     } catch (err) {
//         res.status(500).json({ error: "Failed to generate speech via Gemini" });
//     }
// });

// 8. สร้างข้อความข่าววิ่ง (Ticker)
router.post('/generate-ticker', verifyToken, async (req, res) => {
    const { allData, lang, pageId } = req.body; 
    const langInstruction = getLangInstruction(lang)

    let prompt = prompts.getTicker(allData, langInstruction)

    try {
        const result = await generateAIResponse(prompt, {
            action: 'generate_ticker',
            pageId: pageId,
            lang: lang
        });
        
        res.json({ 
            message: result.text,
            id: result.id,
            usage: result.usage,
            input: result.input
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to generate ticker content." });
    }
});

// 9. แชร์สรุป (สร้างลิงก์ QR Code)
router.post('/share', (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: "No text" });

        const id = uuidv4().substring(0, 8);
        summaryStore[id] = text;
        
        res.json({ id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});

// 10. หน้าเว็บสำหรับดูสรุปที่แชร์ (HTML View)
router.get('/view/:id', (req, res) => {
    const { id } = req.params;
    const content = summaryStore[id];

    if (!content) {
        return res.status(404).send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1>⚠️ ไม่พบข้อมูล</h1>
                <p>ข้อมูลอาจหมดอายุ หรือ Server ถูกรีสตาร์ท</p>
            </div>
        `);
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI Summary</title>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body { font-family: 'Sarabun', sans-serif; padding: 0; margin: 0; background: #f4f7f6; color: #333; }
                .container { max-width: 600px; margin: 20px auto; background: white; padding: 25px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); position: relative; }
                h2 { color: #00c49f; border-bottom: 2px solid #f0f0f0; padding-bottom: 15px; margin-top: 0; font-size: 1.4rem; }
                .content { white-space: pre-line; font-size: 1rem; line-height: 1.7; color: #444; margin-bottom: 30px; }
                strong { color: #008a70; font-weight: bold; }
                
                /* --- Action Buttons --- */
                .action-bar {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                    border-top: 1px solid #eee;
                    padding-top: 20px;
                }
                .btn {
                    flex: 1;
                    padding: 12px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-family: 'Sarabun', sans-serif;
                    font-weight: bold;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: transform 0.1s;
                    text-decoration: none; /* สำหรับลิงก์ */
                }
                .btn:active { transform: scale(0.96); }
                
                .btn-copy { background: #e9ecef; color: #333; }
                .btn-line { background: #06c755; color: white; }
                .btn-share { background: #007bff; color: white; }

                .footer { margin-top: 20px; text-align: center; font-size: 0.8rem; color: #ccc; }
                
                /* Toast Notification */
                #toast {
                    visibility: hidden;
                    min-width: 250px;
                    background-color: #333;
                    color: #fff;
                    text-align: center;
                    border-radius: 50px;
                    padding: 16px;
                    position: fixed;
                    z-index: 1;
                    left: 50%;
                    bottom: 30px;
                    transform: translateX(-50%);
                    font-size: 14px;
                }
                #toast.show { visibility: visible; animation: fadein 0.5s, fadeout 0.5s 2.5s; }
                @keyframes fadein { from {bottom: 0; opacity: 0;} to {bottom: 30px; opacity: 1;} }
                @keyframes fadeout { from {bottom: 30px; opacity: 1;} to {bottom: 0; opacity: 0;} }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>🤖 AI Summary by EZ</h2>
                
                <div class="content" id="content-text">${content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')}</div>

                <div class="action-bar">
                    <button class="btn btn-copy" onclick="copyContent()">
                        <i class="fa-regular fa-copy"></i> Copy
                    </button>
                    
                    <button class="btn btn-line" onclick="shareToLine()">
                        <i class="fa-brands fa-line"></i> LINE
                    </button>
                    
                    <button class="btn btn-share" onclick="nativeShare()">
                        <i class="fa-solid fa-share-nodes"></i> Share
                    </button>
                </div>

                <div class="footer">Powered by EZ Dashboard</div>
            </div>

            <div id="toast">Text copied</div>

            <script>
                // ดึงข้อความดิบ (เอา <br> ออกเพื่อให้ก๊อปไปวางสวยๆ)
                function getRawText() {
                    const html = document.getElementById('content-text').innerHTML;
                    return html.replace(/<br\\s*\\/?>/gi, '\\n').replace(/<[^>]+>/g, ''); // แปลง br เป็น newline และลบ tag อื่นๆ
                }

                function copyContent() {
                    const text = getRawText();
                    navigator.clipboard.writeText(text).then(() => {
                        showToast("Text copied");
                    }).catch(err => {
                        alert("Copy failed!");
                    });
                }

                function shareToLine() {
                    const currentUrl = window.location.href; // ลิงก์ของหน้านี้
                    const message = "🤖 AI Summary By EZ\\n\\n" +
                                        "อ่านสรุปฉบับเต็มได้ที่นี่:\\n" +
                                        "Read the full summary here:\\n\\n" +
                                        currentUrl;

                    // ส่งเข้า LINE
                    window.location.href = "https://line.me/R/msg/text/?" + encodeURIComponent(message);
                }

                async function nativeShare() {
                    // 1. เตรียมลิงก์ (ลบพารามิเตอร์แปลกปลอมออก)
                    const cleanUrl = window.location.href.replace(/[?&]openExternalBrowser=1/, "");
                    
                    if (navigator.share) {
                        try {
                            await navigator.share({
                                title: 'AI Summary', // หัวข้อสำหรับบางแอป
                                text: "🤖 AI Summary By EZ\\n\\n" +
                                      "อ่านสรุปฉบับเต็มได้ที่นี่:\\n" +
                                      "Read the full summary here:",
                                url: cleanUrl // ส่งลิงก์ไปด้วย (Browser จะเอาไปต่อท้ายข้อความให้เอง)
                            });
                        } catch (err) {
                            // ผู้ใช้กดยกเลิก
                        }
                    } else {
                        // ⚠️ กรณีแชร์ไม่ได้ (เช่น บนคอม) -> คัดลอกลิงก์ให้แทนเหมือนเดิม
                        navigator.clipboard.writeText(cleanUrl).then(() => {
                            alert("This browser does not support sharing.\\nThe link has been copied to your clipboard instead!\\n(You can paste it to share now)");
                        }).catch(err => {
                            alert("Failed to copy link.");
                        });
                    }
                }

                function showToast(msg) {
                    var x = document.getElementById("toast");
                    x.innerText = msg;
                    x.className = "show";
                    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
                }
            </script>
        </body>
        </html>
    `);
});

module.exports = router;