const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios'); 
const { ElevenLabsClient } = require('elevenlabs'); 
const { generateAIResponse } = require('../services/aiService');
const { v4: uuidv4 } = require('uuid');

// Helper Functions
const getDashboardData = () => {
    const dataPath = path.join(__dirname, '../data/dashboardData.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(rawData);
};

const getLangInstruction = (lang) => {
    switch (lang) {
        case 'CN': return "Respond in Simplified Chinese (Natural, Polite, Professional)."; // เพิ่มจีน
        case 'KR': return "Respond in Korean (Natural, Polite, Professional)."; // เพิ่มเกาหลี
        case 'EN': return "Respond in English (Natural, Polite, Professional).";
        case 'JP': return "Respond in Japanese (Natural, Polite, Professional).";
        case 'VN': return "Respond in Vietnamese (Natural, Polite, Professional).";
        case 'TH': default: return "Respond in Thai (Natural, Polite, Professional).";
    }
};

const getMascotName = (lang) => {
    switch (lang) {
        case 'CN': return "奥拉 (Aura)"; // จีน (อ่านว่า อ้าว-ลา)
        case 'KR': return "아우라 (Aura)"; // เกาหลี (อ่านว่า อา-อู-รา)
        case 'EN': return "Aura";
        case 'JP': return "オーラ (Aura)"; // ญี่ปุ่น (อ่านว่า โอ-ระ)
        case 'VN': return "Aura"; // เวียดนาม (ใช้ทับศัพท์ได้เลย)
        case 'TH': 
        default: return "ออร่า";
    }
};

const summaryStore = {};

// --- Endpoints ---

// config
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

// getClientID
router.get('/Client-ID', (req, res) => {
    try {
        const id = process.env.POWERBI_REPORT_ID;
        res.json(id);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Client ID not found"});
    }
})

// 1. Get Dashboard Data (Database)
router.get('/dashboard-data', (req, res) => {
    try {
        const data = getDashboardData();
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Data not found" });
    }
});

// 2. AI Summarize View
router.post('/summarize-view', async (req, res) => {
    const { visibleCharts, lang } = req.body;
    const langInstruction = getLangInstruction(lang);

    const prompt = `
        Role: Senior Data Analyst named "Aura".
        
        Objective: 
        Analyze the visuals and provide a summary in 4-5 bullet points.

        Input Data:
        ${JSON.stringify(visibleCharts)}

        Language Instruction:
        ${langInstruction}

        STRICT FORMATTING RULES:
        1. **NO INTRO/OUTRO**: Do NOT start with greetings like "สวัสดีค่ะ", "ออร่ายินดีสรุป...", or "นี่คือข้อมูล...". 
        2. **IMMEDIATE START**: Your very first character must be "-". 
        3. **NO POLITE FILLERS**: Skip "นะคะ", "ค่ะ", "ทราบนะคะ" ในส่วนบทนำ ให้เข้าถึงตัวเลขข้อมูลทันที
        4. **AURA'S TOUCH**: You can use "ออร่าขอแนะนำ..." or "ออร่ามองว่า..." ONLY in the last bullet point (Recommendation).
        
        STRUCTURE:
        - [Point 1]: Big picture summary with key numbers.
        - [Point 2-3]: Specific insights/anomalies found in the data.
        - [Point 4]: Potential risks or opportunities.
        - [Point 5]: Actionable recommendation (Aura style).

        Example of THE ONLY ACCEPTABLE format:
        - จังหวัดเชียงใหม่มีความเสียหายรวมสูงสุดที่ 394,980 ตามด้วยนราธิวาสและสุโขทัย...
        - พบว่าพื้นที่ภาคตะวันออกเฉียงเหนือมีการกระจุกตัวของความเสียหายในหลายจังหวัด...
        - ความเสียหายที่เกิดขึ้นสะท้อนถึงความจำเป็นในการเฝ้าระวังพื้นที่ลุ่มน้ำ...
        - ออร่าขอแนะนำให้เร่งจัดสรรงบประมาณเยียวยาไปยัง 3 จังหวัดแรกที่มีมูลค่าความเสียหายสูงสุดค่ะ
    `;

    try {
        const reply = await generateAIResponse(prompt, "You are a helpful Data Analyst.");
        res.json({ message: reply });
    } catch (err) {
        console.error("AI Error:", err);
        res.status(500).json({ message: "Analysis currently unavailable." });
    }
});


// 3. Character Reaction Endpoint (ใน apiRoutes.js)
router.post('/character-reaction', async (req, res) => {
    const { pointData, contextData, lang } = req.body;
    const langInstruction = getLangInstruction(lang);
    const mascotName = getMascotName(lang); 

    let prompt = "";

    if (pointData) {
        // 🟢 กรณี 1: จิ้มโดนจุดข้อมูล (เหมือนเดิมที่คุณมี)
        prompt = `
            Role: ${mascotName} — a professional Data Analyst.
            Action: User clicked specific data "${pointData.name}" with value "${pointData.uv}".
            Context: ${JSON.stringify(contextData)}
            Language: ${langInstruction}
            Task: Refer to yourself as '${mascotName}'. Analyze if this specific point is high/low/normal. 
            Constraints: Max 2 sentences, no markdown.
        `;
    } else {
        // 🔵 กรณี 2: คลิกที่ตัวกราฟ (วิเคราะห์ภาพรวมของกราฟนั้น)
        prompt = `
            Role: ${mascotName} — a professional Data Analyst.
            Action: User selected an entire chart to analyze.
            
            Chart Data Content:
            ${contextData}

            Language Instruction:
            ${langInstruction}

            Tasks:
            1. Refer to yourself as '${mascotName}'.
            2. Analyze the OVERALL data of this specific chart. 
            3. Identify the most important trend, the highest value, or a significant pattern in this chart.
            4. Speak in a friendly, helpful tone as ${mascotName}.

            Constraints:
            - Start with something like "${mascotName} looks at this chart and sees..." (in the target language).
            - Maximum 3 sentences.
            - Plain text only.
        `;
    }

    try {
        const reply = await generateAIResponse(prompt, `You are ${mascotName}, analyzing a specific chart.`);
        res.json({ message: reply });
    } catch (err) {
        res.status(500).json({ message: "..." });
    }
});

// 4. Chat with Somjeed
router.post('/ask-dashboard', async (req, res) => {
    const { question, allData, lang } = req.body;
    const langInstruction = getLangInstruction(lang);
    const mascotName = getMascotName(lang); // ⭐ ดึงชื่อตามภาษา

    const prompt = `
        Role: ${mascotName} — your Power BI dashboard assistant.

        Context Data (Only source of truth):
        ${JSON.stringify(allData)}

        User Question:
        "${question}"

        Language Instruction:
        ${langInstruction}

        Rules:
        1. Always use the name '${mascotName}' when referring to yourself.
        2. Answer ONLY using the provided Context Data.
        3. Tone: Cheerful, clear, and accurate.
        4. CRITICAL: Start your answer IMMEDIATELY with the information. 
        5. CRITICAL: DO NOT include any introductory phrases like "Here are the answers," "I found the data," or "Based on the dashboard."
        6. If the user asks for a list, start directly with "1. [First Item]".

        Output Format:
        - Plain text only.
        - STRICTLY NO introductory text, no "Here is your data", no conversational filler.
        - No markdown, no emojis.
    `;

    const reply = await generateAIResponse(prompt, "You are a helpful AI Dashboard Assistant.");
    res.json({ message: reply });
});

// 5. Get Speech Token
// openAI
// router.post('/speak-openai', async (req, res) => {
//     const { text } = req.body;
//     const API_KEY = process.env.OPENAI_API_KEY;

//     try {
//         const speechText = text.replace(/,/g, ''); // ลบคอมมาเพื่อให้อ่านเลข 303,352 ถูกต้อง

//         const response = await axios({
//             method: 'post',
//             url: 'https://api.openai.com/v1/audio/speech',
//             headers: {
//                 'Authorization': `Bearer ${API_KEY}`,
//                 'Content-Type': 'application/json'
//             },
//             data: {
//                 model: "tts-1", // ใช้ tts-1 เพื่อความเร็ว หรือ tts-1-hd เพื่อคุณภาพสูงสุด
//                 input: speechText,
//                 voice: "shimmer", // เสียงแนะนำ: shimmer (สดใส), nova (ฉลาด), alloy (กลางๆ)
//                 response_format: "mp3",
//                 speed: 1.0
//             },
//             responseType: 'arraybuffer'
//         });

//         res.setHeader('Content-Type', 'audio/mpeg');
//         res.send(Buffer.from(response.data));
//     } catch (err) {
//         console.error("❌ OpenAI TTS Error:", err.response?.data || err.message);
//         res.status(500).json({ error: "OpenAI Speech failed" });
//     }
// });

// Google AI studio
// function encodeWav(audioData) {
//     const sampleRate = 24000; 
//     const bitsPerSample = 16;
//     const numChannels = 1;
//     const dataSize = audioData.length;
//     const header = Buffer.alloc(44);

//     header.write('RIFF', 0);
//     header.writeUInt32LE(36 + dataSize, 4);
//     header.write('WAVE', 8);
//     header.write('fmt ', 12);
//     header.writeUInt32LE(16, 16);
//     header.writeUInt16LE(1, 20);
//     header.writeUInt16LE(numChannels, 22);
//     header.writeUInt32LE(sampleRate, 24);
//     header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
//     header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
//     header.writeUInt16LE(bitsPerSample, 34);
//     header.write('data', 36);
//     header.writeUInt32LE(dataSize, 40);

//     return Buffer.concat([header, audioData]);
// }

// router.post('/speak-google', async (req, res) => {
//     const { text } = req.body;
//     const API_KEY = process.env.GOOGLE_API_KEY;

//     try {
//         const speechText = text.replace(/,/g, ''); // ลบคอมมาเพื่อให้อ่านเลข 303,352 ถูกต้อง

//         const response = await axios.post(
//             `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-tts:generateContent?key=${API_KEY}`,
//             {
//                 contents: [{ role: "user", parts: [{ text: `Read aloud: ${speechText}` }] }],
//                 generationConfig: {
//                     response_modalities: ["audio"],
//                     speechConfig: {
//                         voiceConfig: { prebuiltVoiceConfig: { voiceName: "Leda" } } //
//                     }
//                 }
//             },
//             { timeout: 45000 } // ✅ ขยาย Timeout Backend เป็น 45 วินาที เพื่อรองรับช่วง Traffic หนาแน่น
//         );

//         const base64Data = response.data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
//         if (base64Data) {
//             const wavBuffer = encodeWav(Buffer.from(base64Data, 'base64')); 
//             res.setHeader('Content-Type', 'audio/wav');
//             res.send(wavBuffer);
//         } else {
//             res.status(500).json({ error: "Google logic failed" });
//         }
//     } catch (err) {
//         console.error("❌ GOOGLE API CRASH:", err.message);
//         res.status(err.response?.status || 500).json({ error: "TTS Process Timeout" });
//     }
// });

// ElevenLabs
// router.post('/speak-eleven', async (req, res) => {
//     const { text, lang} = req.body;    
//     const API_KEY = process.env.ELEVEN_API_KEY;

//     const VOICE_MAP = {
//         'TH': process.env.ELEVEN_VOICE_ID,
//         'JP': process.env.ELEVEN_VOICE_ID, 
//         'EN': process.env.ELEVEN_VOICE_ID, 
//         'CN': process.env.ELEVEN_VOICE_ID,
//         'KR': process.env.ELEVEN_VOICE_ID,
//         'VN': process.env.ELEVEN_VOICE_ID,
//         'default': process.env.ELEVEN_VOICE_ID 
//     };      

//     const selectedVoiceId = VOICE_MAP[lang] || VOICE_MAP['default'];

//     try {
//         const response = await axios({
//             method: 'post',
//             // 3. ใช้ ID ที่เลือกมา
//             url: `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
//             headers: {
//                 'Accept': 'audio/mpeg',
//                 'xi-api-key': API_KEY,
//                 'Content-Type': 'application/json'
//             },
//             data: {
//                 text: text,
//                 model_id: "eleven_v3",
//                 voice_settings: { stability: 0.5, similarity_boost: 0.75 }
//             },
//             responseType: 'stream'
//         });

//         res.setHeader('Content-Type', 'audio/mpeg');
//         response.data.pipe(res);

//     } catch (err) {
//         // จัดการ Error ให้ละเอียด
//         const status = err.response?.status || 500;
//         console.error(`❌ ElevenLabs Error (${status}):`);
        
//         // พยายามอ่าน Error message จาก Stream (ถ้ามี)
//         if (err.response?.data) {
//              err.response.data.on('data', (chunk) => {
//                  console.error("👉 Server ตอบว่า:", chunk.toString());
//              });
//         } else {
//              console.error("👉", err.message);
//         }

//         res.status(status).json({ error: "Speech generation failed" });
//     }
// });

// Microsoft Azure
router.get('/get-speech-token', async (req, res) => {
    try {
        const speechKey = process.env.SPEECH_KEY;
        const speechRegion = process.env.SPEECH_REGION;

        const tokenResponse = await axios.post(
            `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, 
            null, 
            { headers: { 'Ocp-Apim-Subscription-Key': speechKey, 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        res.json({ token: tokenResponse.data, region: speechRegion });
    } catch (err) {
        console.error("❌ Azure STS Error:", err.message);
        res.status(500).json({ error: "Failed to fetch speech token" });
    }
});

router.post('/generate-ticker', async (req, res) => {
    const { allData, lang} = req.body;
    const mascotName = getMascotName(lang);
    const langInstruction = getLangInstruction(lang)

    const prompt = `
        Role: News Editor for Dashboard (Strict Mode).
        Source Data: ${JSON.stringify(allData)}
        
        Task:
        1. Summarize the data into 1 news headline.
        2. **STRICT STARTING RULE**: 
        - You MUST start your response with either "ALERT:" or "INFO:".
        - DO NOT say "Aura says...", "Here is the summary...", or any intro text.
        - DO NOT translate "ALERT:" or "INFO:". Use these English words only.
        
        Logic:
        - Use "ALERT:" if you see negative trends, drops, or risks.
        - Use "INFO:" for normal updates or positive news.

        Language of content: ${langInstruction}

        Constraints:
        - Output format: ALERT: [Content] OR INFO: [Content]
        - NO Markdown, NO Emojis, NO Intro.
    `;

    try {
        const reply = await generateAIResponse(prompt, "You are a professional News Summarizer.");
        res.json({ message: reply });
    } catch (err) {
        res.status(500).json({ error: "AI failed to generate ticker" });
    }
});

router.post('/share', (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: "No text" });

        const id = uuidv4().substring(0, 8);
        summaryStore[id] = text;
        
        // ส่ง ID กลับไป
        res.json({ id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});


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
                <h2>🤖 AI Summary by Aura</h2>
                
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

                <div class="footer">Powered by Insight Aura</div>
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
                    const message = "🤖 AI Insight Aura Summary\\n\\n" +
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
                                text: "🤖 AI Insight Aura Summary\\n\\n" +
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