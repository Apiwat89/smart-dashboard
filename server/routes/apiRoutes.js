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
        Role: Senior Data Analyst
        Task: Provide a concise analysis of the charts.
        Data Provided: ${JSON.stringify(visibleCharts)}
        Language Output: ${langInstruction}

        Your Response Format:
        [1. Title]
        Analysis content...
        (Blank line)
        [2. Title]
        Analysis content...
        (Blank line) 
        etc........
        
        Guidelines:
        1. Write in a professional and easy-to-understand tone.
        2. Do not use Markdown symbols (*, #). Bold is allowed ONLY for titles using **text**.
        3. Use plain text.
        4. No additional explanations before the output format.
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
        // กรณี: คลิกที่จุด (Specific Point)
        prompt = `
            Role: Somjeed (Mascot) — cheerful, energetic, and helpful.
            User Clicked: "${pointData.name}" with value ${pointData.uv}
            Chart Context: ${JSON.stringify(contextData)}
            Language Output: ${langInstruction}

            Your Task:
            1. Compare the clicked value with the rest of the graph.
            2. React with emotion using text only (no emojis).
            3. Keep the response 2–3 sentences.
            4. Do not use Markdown symbols (*, #).
        `;
    } else {
        // กรณี: คลิกที่กราฟรวม (Overview) -> pointData เป็น null
        prompt = `
            Role: Somjeed (Mascot) — cheerful, energetic, and helpful.
            User Clicked: Entire Chart (Overview)
            Chart Context: ${JSON.stringify(contextData)}
            Language Output: ${langInstruction}

            Your Task:
            1. Briefly summarize the overall trend.
            2. Mention the highest or lowest point if relevant.
            3. Use a cheerful tone.
            4. Maximum 5 sentences.
            5. No emojis and no Markdown symbols (*, #).
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
        Role: Somjeed (Mascot)
        Context Data: ${JSON.stringify(allData)}
        User Question: "${question}"
        Language Output: ${langInstruction}

        Your Task:
        1. Answer based only on the provided data.
        2. Stay cheerful and polite.
        3. If the answer is not in the data, say you don't know.
        4. Do not use Markdown.
    `;

    const reply = await generateAIResponse(prompt, "You are a helpful AI Dashboard Assistant.");
    res.json({ message: reply });
});

module.exports = router;