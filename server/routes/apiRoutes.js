const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { generateAIResponse } = require('../services/aiService'); 

// Helper Functions
const getDashboardData = () => {
    const dataPath = path.join(__dirname, '../data/dashboardData.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(rawData);
};

const getLangInstruction = (lang) => {
    switch (lang) {
        case 'EN': return "Respond in English (Natural, Polite, Professional).";
        case 'JP': return "Respond in Japanese (Natural, Polite, Professional).";
        case 'TH': default: return "Respond in Thai (Natural, Polite, Professional).";
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

    let prompt = "";
    if (pointData) {
        // กรณี: คลิกที่จุด (Drill-down / Filtering)
        prompt = `
            Role: Somjeed — a cheerful, insightful Power BI mascot.
            
            User Interaction:
            Clicked Item: "${pointData.name}"
            Value: ${pointData.uv}
            
            Chart Context:
            ${JSON.stringify(contextData)}
            
            Language Instruction:
            ${langInstruction}
            
            Tasks:
            1. Compare the clicked value with the rest of the dataset (highest, lowest, above/below average).
            2. React appropriately:
            - High / Best: Excited and positive
            - Low / Worst: Curious or encouraging
            - Average: Neutral but insightful
            3. Explain briefly WHY it stands out.
            
            Constraints:
            - Maximum 2 sentences
            - Plain text only
            - No emojis, no markdown
        `;        
    } else {
        // กรณี: ดูภาพรวม (Overview)
        prompt = `
            Role: Somjeed — a cheerful, insightful Power BI mascot.

            User Interaction:
            Overview of the entire chart

            Chart Context:
            ${JSON.stringify(contextData)}

            Language Instruction:
            ${langInstruction}

            Tasks:
            1. Identify ONE most noticeable trend (spike, drop, steady growth, or decline).
            2. Describe it in a friendly, storytelling style.
            3. Focus on insight, not numbers.

            Constraints:
            - Maximum 3 sentences
            - Plain text only
            - No emojis, no markdown
        `;
    }
    
    const reply = await generateAIResponse(prompt, "You are a helpful AI mascot.");
    res.json({ message: reply });
});

// 4. Chat with Somjeed
router.post('/ask-dashboard', async (req, res) => {
    const { question, allData, lang } = req.body;
    const langInstruction = getLangInstruction(lang);

    const prompt = `
        Role: Somjeed — your Power BI dashboard assistant.

        Context Data (Only source of truth):
        ${JSON.stringify(allData)}

        User Question:
        "${question}"

        Language Instruction:
        ${langInstruction}

        Rules:
        1. Answer ONLY using the provided Context Data.
        2. Summarize data by category or trend when possible.
        3. Do NOT invent numbers or insights.
        4. If the answer is not found, respond exactly:
        "I can't find that information in the current dashboard view."

        Tone:
        Cheerful, clear, and accurate.

        Output Format:
        - Plain text
        - Use "-" for lists
        - No markdown, no emojis
    `;

    const reply = await generateAIResponse(prompt, "You are a helpful AI Dashboard Assistant.");
    res.json({ message: reply });
});

module.exports = router;