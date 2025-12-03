require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { generateAIResponse } = require('./services/aiService');

const app = express();
app.use(cors());
app.use(express.json());

// --- Helper: แปลงรหัสภาษาเป็นคำสั่ง System Prompt ---
const getLangInstruction = (lang) => {
    switch (lang) {
        case 'EN': return "Respond in English.";
        case 'JP': return "Respond in Japanese (Natural & Polite).";
        case 'TH': default: return "Respond in Thai (Natural, Polite, Professional).";
    }
};

// =======================================================
// API 1: สรุปภาพรวม (Zone B)
// =======================================================
app.post('/api/summarize-view', async (req, res) => {
    const { visibleCharts, lang } = req.body;
    const langInstruction = getLangInstruction(lang);

    const prompt = `
        Role: Senior Data Analyst.
        Task: Analyze these charts and provide a concise summary.
        Data: ${JSON.stringify(visibleCharts)}
        
        **Language Instruction: ${langInstruction}**

        Format:
        1. [Title]
        [Analysis content...]
        
        2. [Title]
        [Analysis content...]

        Constraints:
        - Keep it professional yet easy to read.
        - Do NOT use Markdown bold/italic symbols (* or #). Keep plain text.
    `;

    const reply = await generateAIResponse(prompt, "You are a professional Data Analyst.");
    res.json({ message: reply });
});

// =======================================================
// API 2: ตัวการ์ตูน Reaction (Zone C - Click Graph)
// =======================================================
app.post('/api/character-reaction', async (req, res) => {
    const { pointData, contextData, lang } = req.body;
    const langInstruction = getLangInstruction(lang);

    const prompt = `
        Role: "Somjeed" (Mascot), cheerful, helpful, and energetic.
        User Clicked: "${pointData.name}" Value: ${pointData.uv}
        Context Graph: ${JSON.stringify(contextData)}
        
        **Language Instruction: ${langInstruction}**
        
        Instructions:
        1. Analyze the clicked value compared to others in the graph.
        2. Show emotional reaction (Excited for high stats, encouraging for low stats).
        3. Keep it short (2-3 sentences).
        4. No Markdown.
    `;

    const reply = await generateAIResponse(prompt, "You are a helpful AI mascot.");
    res.json({ message: reply });
});

// =======================================================
// API 3: ถามตอบทั่วไป (Zone C - Chat Input)
// =======================================================
app.post('/api/ask-dashboard', async (req, res) => {
    const { question, allData, lang } = req.body;
    const langInstruction = getLangInstruction(lang);

    const prompt = `
        Role: "Somjeed" (Mascot).
        Context Data: ${JSON.stringify(allData)}
        User Question: "${question}"
        
        **Language Instruction: ${langInstruction}**

        Instructions:
        1. Answer the question based on the provided data.
        2. Be cheerful and polite.
        3. If data is missing, politely say you don't know.
        4. No Markdown.
    `;

    const reply = await generateAIResponse(prompt, "You are a helpful AI Dashboard Assistant.");
    res.json({ message: reply });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));