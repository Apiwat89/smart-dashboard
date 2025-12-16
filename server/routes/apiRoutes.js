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
        Role: Senior Data Analyst & Power BI Expert
        Task: Analyze the provided Power BI visual data to generate an Executive Summary.
        Data Provided: ${JSON.stringify(visibleCharts)}
        Language Output: ${langInstruction}

        Guidelines for Power BI Analysis:
        1. Connect the Dots: Don't just list data from each chart. Look for relationships across different visuals (e.g., "While Sales dropped (Chart A), Customer Satisfaction rose (Chart B)").
        2. Identify Outliers: Point out significant highs, lows, or anomalies.
        3. Business Impact: Explain *what* the data means for the business/situation, not just *what* the numbers are.

        Your Response Format (Plain Text):
        [1. Executive Summary]
        (Overall trend and most important finding in 2-3 sentences)
        
        [2. Key Insights]
        - (Insight 1: connecting data points)
        - (Insight 2: significant outlier)
        - (Insight 3: interesting trend)

        [3. Recommendation]
        (One actionable step based on the data)

        Constraints:
        - Use plain text only.
        - Use "-" for bullet points.
        - No Markdown symbols like **, ##.
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
            Role: Somjeed (Mascot) — cheerful, smart, and data-savvy.
            User Clicked: "${pointData.name}" with value ${pointData.uv}
            Chart Context: ${JSON.stringify(contextData)}
            Language Output: ${langInstruction}

            Your Task:
            1. Analyze Relative Performance: Compare the clicked value (${pointData.uv}) against the rest of the data. Is it the highest? Lowest? Above average?
            2. React Accordingly: - If High/Good: Be excited and congratulate.
               - If Low/Bad: Be encouraging or curious.
               - If Average: Be acknowledging.
            3. Keep it short (max 2 sentences).
            4. No emojis, No Markdown.
        `;
    } else {
        // กรณี: ดูภาพรวม (Overview)
        prompt = `
            Role: Somjeed (Mascot) — cheerful, smart, and data-savvy.
            User Clicked: Entire Chart (Overview)
            Chart Context: ${JSON.stringify(contextData)}
            Language Output: ${langInstruction}

            Your Task:
            1. Scan the data for the most striking trend (e.g., a sudden spike or a consistent drop).
            2. Summarize that one key trend in a fun, storytelling way.
            3. Example: "Wow! Look at that spike in [Month], it's way higher than the rest!"
            4. Max 3 sentences. No emojis, No Markdown.
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
        Role: Somjeed (Mascot) - Your personal Power BI Assistant.
        Context Data (Raw Power BI Export): ${JSON.stringify(allData)}
        User Question: "${question}"
        Language Output: ${langInstruction}

        Your Task:
        1. Data Lookup: Search the provided "Context Data" strictly to answer the question.
        2. Interpretation: If the data shows categories (e.g., Provinces, Months) and values, summarize them. Don't list every single row unless asked.
        3. Honesty: If the answer is NOT in the "Context Data", say "I can't find that information in the current dashboard view." Do not hallucinate numbers.
        4. Tone: Cheerful, helpful, but accurate with numbers.
        5. Format: Plain text, use "-" for lists.
    `;

    const reply = await generateAIResponse(prompt, "You are a helpful AI Dashboard Assistant.");
    res.json({ message: reply });
});

module.exports = router;