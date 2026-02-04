// server/services/aiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../database/database'); 
const { v4: uuidv4 } = require('uuid'); 
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY; 
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });

// 🛠️ แก้ไข _insertLog ให้รับค่า Token ครบ 3 ตัว
function _insertLog(data) {
    const sql = `
        INSERT INTO ai_logs 
        (request_id, page_name, action_type, language, input_context, ai_response, input_tokens, output_tokens, total_tokens, saved_tokens, processing_time_ms, saved_time_ms, is_cached)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) -- 👈 เพิ่มเป็น 13 ตัว
    `;
    
    const params = [
        data.reqId || 'unknown',
        data.page || 'unknown',
        data.action || 'general',
        data.lang || 'TH',
        data.input || '',
        data.output || '',
        
        // 👇 เก็บครบ 3 ตัว
        data.input_tokens || 0,      
        data.output_tokens || 0,
        data.total_tokens || 0,
        
        data.savedTokens || 0,
        data.time || 0,
        data.savedTime || 0,
        data.isCached ? 1 : 0
    ];

    db.run(sql, params, (err) => {
        if (err) console.error("❌ Log Insert Error:", err.message);
    });
}

// ✅ แก้ไข generateAIResponse
async function generateAIResponse(userMessage, systemRole = "You are a helpful assistant.", logContext = {}) {
    const startTime = Date.now();
    const reqId = uuidv4();

    try {
        console.log(`Sending to Gemini [${logContext.action || 'General'}]...`);
        
        const finalPrompt = `${systemRole}\n\nUser Question: ${userMessage}`;
        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        const text = response.text();
        
        // 🟢 ดึงข้อมูล Usage
        const usage = response.usageMetadata || {};
        const input_tokens = usage.promptTokenCount || 0;      // ขาเข้า
        const output_tokens = usage.candidatesTokenCount || 0; // ขาออก
        const total_tokens = usage.totalTokenCount || (input_tokens + output_tokens); // ผลรวม

        const duration = Date.now() - startTime;

        // บันทึก Log (ส่งไปครบ 3 ตัว)
        _insertLog({
            reqId: reqId,
            page: logContext.pageId,
            action: logContext.action,
            lang: logContext.lang,
            input: finalPrompt, // เก็บ Prompt จริงตามที่คุยไว้
            output: text,
            
            input_tokens: input_tokens,       
            output_tokens: output_tokens, 
            total_tokens: total_tokens,         
            
            savedTokens: 0,
            time: duration,
            savedTime: 0,
            isCached: false
        });

        return { 
            text: text, 
            id: reqId, 
            usage: { 
                input_tokens: input_tokens,
                output_tokens: output_tokens,
                total_tokens: total_tokens 
            },
            input: finalPrompt 
        };

    } catch (error) {
        console.error("❌ Gemini Error:", error.message);
        return {
            text: "ขออภัยครับ ระบบ AI ขัดข้องชั่วคราว",
            id: reqId,
            usage: { total_tokens: 0 },
            input: finalPrompt
        };
    }
}

// ✅ แก้ไข logCacheHit
function logCacheHit(data) {
    _insertLog({
        reqId: data.reqId,
        page: data.pageId,
        action: data.action || 'cache_view',
        lang: data.lang,
        input: data.input || 'Cached View',
        output: data.output || 'Displayed from Cache',
        
        input_tokens: data.inputToken, 
        output_tokens: data.outputToken,
        total_tokens: data.totalToken,
        
        savedTokens: data.savedTokens, // ยอดที่ประหยัดได้
        time: 0,
        savedTime: data.savedTime || 0,
        isCached: true
    });
}

module.exports = { generateAIResponse, logCacheHit };