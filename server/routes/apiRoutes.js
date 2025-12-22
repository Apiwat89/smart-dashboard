const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
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
        case 'TH': default: return "Respond in Thai (Natural, Polite, Professional).";
    }
};

const getMascotName = (lang) => {
    switch (lang) {
        case 'CN': return "小橘 (Somjeed)"; // ชื่อจีน
        case 'KR': return "솜짓 (Somjeed)"; // ชื่อเกาหลี
        case 'EN': return "Somjeed";
        case 'JP': return "ソムジード (Somjeed)";
        case 'TH': 
        default: return "ส้มจี๊ด";
    }
};

// --- Endpoints ---

// 1. Get Dashboard Data (Database)
router.get('/dashboard-data', (req, res) => {
    try {
        const data = getDashboardData();
        setTimeout(() => res.json(data), 3000);
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
        Role: Senior Data Analyst & Power BI Consultant

        Objective:
        Analyze the provided Power BI visuals and generate an executive-level summary for decision makers.

        Input Data (Visible Charts Only):
        ${JSON.stringify(visibleCharts)}

        Language Instruction:
        ${langInstruction}

        Analysis Rules:
        1. Cross-visual Insight: Connect relationships between charts (cause–effect, contrast, or confirmation).
        2. Highlight Extremes: Identify unusual spikes, drops, or standout values.
        3. Business Meaning: Explain implications, risks, or opportunities — not raw numbers only.
        4. Be concise, factual, and decision-oriented.

        Response Structure (Plain Text Only):
        [Executive Summary]
        - 2–3 sentences summarizing the overall trend and key takeaway.

        [Key Insights]
        - Insight 1 (relationship across charts)
        - Insight 2 (outlier or anomaly)
        - Insight 3 (notable pattern or trend)

        [Recommendation]
        - One clear, actionable recommendation based on the data.

        Constraints:
        - Plain text only
        - Use "-" for bullet points
        - No markdown, no emojis
    `;

    const reply = await generateAIResponse(prompt, "You are a professional Data Analyst.");
    res.json({ message: reply });
});

// 3. Character Reaction
router.post('/character-reaction', async (req, res) => {
    const { pointData, contextData, lang } = req.body;
    const langInstruction = getLangInstruction(lang);
    const mascotName = getMascotName(lang); // ⭐ ดึงชื่อตามภาษา

    let prompt = "";
    if (pointData) {
        prompt = `
            Role: ${mascotName} — a cheerful, insightful Power BI mascot. 
            
            User Interaction:
            Clicked Item: "${pointData.name}"
            Value: ${pointData.uv}
            
            Chart Context:
            ${JSON.stringify(contextData)}
            
            Language Instruction:
            ${langInstruction}
            
            Tasks:
            1. Refer to yourself as '${mascotName}' only.
            2. Compare the clicked value with the rest of the dataset.
            3. React appropriately (High: Excited, Low: Encouraging, Average: Insightful).
            4. Explain briefly WHY it stands out.
            
            Constraints:
            - Maximum 2 sentences
            - Plain text only
            - No emojis, no markdown
        `;        
    } else {
        prompt = `
            Role: ${mascotName} — a cheerful, insightful Power BI mascot.

            User Interaction:
            Overview of the entire chart

            Chart Context:
            ${JSON.stringify(contextData)}

            Language Instruction:
            ${langInstruction}

            Tasks:
            1. Refer to yourself as '${mascotName}' only.
            2. Identify ONE most noticeable trend.
            3. Describe it in a friendly style.

            Constraints:
            - Maximum 3 sentences
            - Plain text only
        `;
    }
    
    const reply = await generateAIResponse(prompt, "You are a helpful AI mascot.");
    res.json({ message: reply });
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
    const mascotName = getMascotName(lang); // ดึงชื่อส้มจี๊ดตามภาษา

    const prompt = `
        Role: News Editor for ${mascotName} Dashboard.
        Source Data (from Page: ${pageTitle}): ${JSON.stringify(allData)}
        
        Task:
        Summarize the data into 3-4 short news headlines for a scrolling ticker.
        - Focus on key numbers or critical warnings.
        - Format: [Icon] Headline | [Icon] Headline
        - Maximum 250 characters total.
        - NO Markdown, NO intro text.
    `;

    try {
        const reply = await generateAIResponse(prompt, "You are a professional News Summarizer.");
        res.json({ message: reply });
    } catch (err) {
        res.status(500).json({ error: "AI failed to generate ticker" });
    }
});

module.exports = router;