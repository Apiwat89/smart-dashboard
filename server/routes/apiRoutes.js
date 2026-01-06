const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios'); 
const { ElevenLabsClient } = require('elevenlabs'); 
const { generateAIResponse } = require('../services/aiService');

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
        case 'VN': return "Respond in Vietnam (Natural, Polite, Professional).";
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

// --- Endpoints ---

// getClientID
router.get('/Client-ID', (req, res) => {
    try {
        const id = process.env.POWERBI_CLIENT_ID;
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


// 3. Character Reaction Endpoint
router.post('/character-reaction', async (req, res) => {
    const { pointData, contextData, lang } = req.body;
    
    // ดึงคำสั่งภาษา และ ชื่อ Mascot
    const langInstruction = getLangInstruction(lang);
    const mascotName = getMascotName(lang); 

    let prompt = "";

    // 🟢 กรณี 1: User จิ้มที่แท่งกราฟ/จุดข้อมูล (Point Click)
    if (pointData) {
        prompt = `
            Role: ${mascotName} — a professional yet friendly Data Analyst Assistant.
            
            User Interaction:
            User clicked on item: "${pointData.name}" with Value: "${pointData.uv}"
            
            Chart Context (for comparison):
            ${JSON.stringify(contextData)}
            
            Language Instruction:
            ${langInstruction}
            
            Tasks:
            1. Refer to yourself as '${mascotName}'.
            2. Analyze the clicked value:
               - Is it high, low, or average compared to others?
               - Is it a good thing or a worrying thing?
            3. **Tone Adjustment**:
               - If Good/High: Be excited and congratulatory.
               - If Bad/Low: Be empathetic and encouraging (don't be too cheerful if the data is bad).
               - If Average: Be informative.
            4. Explain in 1 short sentence WHY this point matters.
            
            Constraints:
            - Maximum 2 sentences.
            - Plain text only (NO markdown, NO emojis).
            - Speak naturally as if talking to the user.
        `;        
    } 
    // 🔵 กรณี 2: ดูภาพรวม (Overview)
    else {
        prompt = `
            Role: ${mascotName} — a professional yet friendly Data Analyst Assistant.

            User Interaction:
            User is viewing the Chart Overview.

            Chart Context:
            ${JSON.stringify(contextData)}

            Language Instruction:
            ${langInstruction}

            Tasks:
            1. Refer to yourself as '${mascotName}'.
            2. Scan for the most obvious pattern (e.g., "Sales are rising" or "April was the lowest").
            3. Summarize it in a friendly, conversational way.

            Constraints:
            - Maximum 2-3 sentences.
            - Plain text only (NO markdown, NO emojis).
            - Focus on the "Big Picture".
        `;
    }
    
    try {
        const reply = await generateAIResponse(prompt, "You are Aura, a helpful data assistant.");
        res.json({ message: reply });
    } catch (err) {
        console.error("Reaction Error:", err);
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

        Output Format:
        - Plain text
        - No markdown, no emojis
    `;

    const reply = await generateAIResponse(prompt, "You are a helpful AI Dashboard Assistant.");
    res.json({ message: reply });
});

// 5. Get Speech Token
// router.post('/speak-eleven', async (req, res) => {
//     const { text, lang} = req.body;    
//     const API_KEY = process.env.ELEVEN_API_KEY;

//     const VOICE_MAP = {
//         'TH': process.env.ELEVEN_VOICE_ID_TH,
//         'JP': process.env.ELEVEN_VOICE_ID_TH, 
//         'EN': process.env.ELEVEN_VOICE_ID_TH, 
//         'CN': process.env.ELEVEN_VOICE_ID_TH,
//         'default': process.env.ELEVEN_VOICE_ID_TH 
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
    const { allData, pageTitle, lang } = req.body;
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

module.exports = router;