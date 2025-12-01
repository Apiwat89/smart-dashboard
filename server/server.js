// server/server.js
const express = require('express');
const cors = require('cors');
const { generateAIResponse } = require('./services/aiService'); // เรียกใช้ไฟล์เมื่อกี้
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// API 1: สรุปภาพรวม (Zone B)
app.post('/api/summarize-view', async (req, res) => {
    const { visibleCharts } = req.body;
    const prompt = `User sees these charts: ${JSON.stringify(visibleCharts)}. Summarize the data trend briefly in Thai.`;
    const reply = await generateAIResponse(prompt, "You are a Data Analyst.");
    res.json({ message: reply });
});

// API 2: ตัวการ์ตูน (Zone C)
app.post('/api/character-reaction', async (req, res) => {
    const { pointData } = req.body;
    const prompt = `User clicked bar graph: ${pointData.name} value ${pointData.uv}. React specifically to this number in Thai (short).`;
    const reply = await generateAIResponse(prompt, "You are a fun mascot.");
    res.json({ message: reply });
});

app.listen(3000, () => console.log('Server running on port 3000'));