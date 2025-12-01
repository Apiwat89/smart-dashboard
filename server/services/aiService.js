// server/services/aiService.js
const OpenAI = require("openai");
require('dotenv').config();

// เช็คว่าตอนนี้รันโหมด DEV หรือ PROD
const isDev = process.env.NODE_ENV !== 'production';

// การตั้งค่า Client
// ถ้าเป็น Dev -> ยิงเข้า localhost:11434 (Ollama)
// ถ้าเป็น Prod -> ยิงเข้า api.openai.com (ของจริง)
const aiClient = new OpenAI({
    baseURL: isDev ? 'http://localhost:11434/v1' : 'https://api.openai.com/v1',
    apiKey: isDev ? 'ollama' : process.env.OPENAI_API_KEY, 
});

async function generateAIResponse(userMessage, systemRole = "You are a helpful assistant.") {
    try {
        console.log(`🤖 AI Processing... (Mode: ${isDev ? 'Ollama/Local' : 'OpenAI/Cloud'})`);
        
        const response = await aiClient.chat.completions.create({
            // ชื่อ Model: ถ้าใช้ Ollama ต้องตรงกับที่โหลดมา (เช่น llama3.2, llama3, qwen)
            model: isDev ? 'llama3.2' : 'gpt-4o-mini', 
            messages: [
                { role: 'system', content: systemRole },
                { role: 'user', content: userMessage }
            ],
            temperature: 0.7, // ความสร้างสรรค์ (0-1)
            max_tokens: 200,  // จำกัดความยาวคำตอบ
        });

        return response.choices[0].message.content;

    } catch (error) {
        console.error("AI Error Connection:", error.message);
        
        if (error.code === 'ECONNREFUSED') {
            return "Error: ลืมเปิด Ollama หรือเปล่าครับ? (Connection Refused)";
        }
        return "ขออภัย ระบบสมองขัดข้องชั่วคราว";
    }
}

module.exports = { generateAIResponse };