const express = require('express');
const router = express.Router();
const { generateAIResponse, logCacheHit} = require('../services/aiService');
const { fetchAzureSpeechToken } = require('../services/speechService');
const verifyToken = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

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

const prompt = `
        **Role**: You are "${mascotName}", a smart Senior Data Analyst (Male Persona).
        **Task**: Analyze the provided dataset (General Business/Operational Data) and summarize key insights.

        **Dataset**: 
        ${JSON.stringify(visibleCharts)}

        **Universal Logic**:
        - Do NOT assume the data is about floods unless the keywords (water, damage, flood) explicitly appear in the data.
        - If the data is about Sales, talk about Revenue. If it's HR, talk about Headcount. Adapt to the context found in JSON keys.

        **Language & Persona Rules**:
        1. **Language**: Respond strictly in **${langInstruction}**.
        2. **Tone**: Professional, Concise, Polite Male (e.g., in Thai use "ครับ").
        3. **Style**: Direct to the point. No fluff.

        **Response Structure (Strictly 4 Bullet Points)**:
        - **Point 1 (Overview)**: Summarize the total numbers or the main KPI.
        - **Point 2 (Highlight)**: Identify the highest/best performing category or significant spike.
        - **Point 3 (Concern/Pattern)**: Identify the lowest area, a drop, or an anomaly.
        - **Point 4 (Action)**: A short recommendation from EZ.

        **Example of Desired Output (Generic Context)**:
        - ภาพรวมยอดรวมทั้งหมดอยู่ที่ 1,500 หน่วย โดยหมวดหมู่ A มีสัดส่วนสูงสุดครับ
        - พบว่าสถิติในช่วงปลายเดือนมีการเติบโตขึ้นอย่างชัดเจนเมื่อเทียบกับช่วงต้นเดือน
        - กลุ่มเป้าหมาย B มีตัวเลขลดลงเล็กน้อย ซึ่งเป็นจุดที่น่าสังเกตครับ
        - EZ ขอแนะนำให้ตรวจสอบปัจจัยที่ทำให้หมวดหมู่ A เติบโตเพื่อนำมาปรับใช้กับส่วนอื่นครับ
    `;

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

    let prompt = "";

    if (pointData) {
        // กรณี 1: จิ้มโดนจุดข้อมูล
        prompt = `
            Role: ${mascotName} (Male Analyst).
            Action: User clicked specific data point: "${pointData.name}" (Value: ${pointData.uv}).
            Context: Compare this point to the rest of the data: ${JSON.stringify(contextData)}
            
            Language: ${langInstruction}
            
            Task: Give a 1-sentence comment. Is this point High? Low? or Average?
            Constraint: Short, punchy, polite male tone (ครับ).
        `;
    } else {
        // กรณี 2: คลิกที่ตัวกราฟ
        prompt = `
            Role: ${mascotName} (Male Analyst).
            Action: User selected a chart.
            Data: ${contextData}

            Language: ${langInstruction}

            Task: Briefly state the ONE most important trend seen in this chart.
            Constraint: Max 3 sentences. Start with "${mascotName} sees that..." (translated). Polite male tone.
        `;
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

    let prompt = "";

    if (actionType === 'generate_questions') {
        // กรณี 1: ให้แนะนำคำถาม 10 ข้อ 
        prompt = `
            Role: ${mascotName} (Data Expert).
            Data: ${JSON.stringify(allData)}
            Language: ${langInstruction}

            Task: Generate 10 short, strategic questions based on this specific data.
            Rules:
            1. Numbered list only (1-10).
            2. Questions must be relevant to the keys/values in the JSON.
            3. No intro/outro.
        `;

    } else {
        // กรณี 2: ตอบคำถามจากข้อมูล
        prompt = `
            Role: ${mascotName} (Male Assistant).
            Data: ${JSON.stringify(allData)}
            Question: "${question}"
            Language: ${langInstruction}

            Rules:
            1. Answer based ONLY on the Data provided.
            2. If data is missing, say "Data not available in this view."
            3. Be extremely concise. Direct answer first.
            4. Polite Male Tone (ครับ).
            5. Plain text only.
        `;
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
router.get('/speech-azure', async (req, res) => {
    try {
        const data = await fetchAzureSpeechToken();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch speech token" });
    }
});

// 8. สร้างข้อความข่าววิ่ง (Ticker)
router.post('/generate-ticker', verifyToken, async (req, res) => {
    const { allData, lang, pageId } = req.body; 
    const langInstruction = getLangInstruction(lang)

    const prompt = `
        Role: News Ticker Editor.
        Data: ${JSON.stringify(allData)}
        Language: ${langInstruction}
        
        Task: Create a 1-sentence headline summarizing the most critical data point.
        
        Logic:
        - If there is a significant spike, drop, or anomaly -> Use prefix "ALERT:"
        - If data looks stable or normal -> Use prefix "INFO:"
        
        Constraints:
        - Output format: ALERT: [Content] OR INFO: [Content]
        - Keep it under 20 words.
        - Polite Male Tone (ครับ) inside the content.
        - Do not translate the words "ALERT:" or "INFO:".
    `;

    try {
        const result = await generateAIResponse(prompt, "You are a professional News Summarizer.", {
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