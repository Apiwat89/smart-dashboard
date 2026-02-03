// server/services/aiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../database/database'); 
const { v4: uuidv4 } = require('uuid'); 
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY; 
// เช็ค Key นิดหน่อยเพื่อความชัวร์
console.log("Checking Key:", API_KEY && API_KEY.startsWith("AIza") ? "Found Key starting with " + API_KEY.substring(0, 5) : "No Key Found or Invalid");

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });

// ฟังก์ชันบันทึก Log (Private)
function _insertLog(data) {
    const sql = `
        INSERT INTO ai_logs 
        (request_id, page_name, action_type, language, input_context, ai_response, total_tokens, saved_tokens, processing_time_ms, saved_time_ms, is_cached)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        data.reqId || 'unknown', data.page || 'unknown', data.action || 'general',
        data.lang || 'TH', data.input || '', data.output || '',
        data.tokens || 0, data.savedTokens || 0, data.time || 0, data.savedTime || 0,
        data.isCached ? 1 : 0
    ];
    db.run(sql, params, (err) => { if (err) console.error("❌ Log Insert Error:", err.message); });
}

// ✅ ฟังก์ชันเรียก AI (ใส่ Logic กลับมาให้ครบแล้ว)
async function generateAIResponse(userMessage, systemRole = "You are a helpful assistant.", logContext = {}) {
    const startTime = Date.now();
    const reqId = uuidv4();

    try {
        console.log(`Sending to Gemini [${logContext.action || 'General'}]...`);
        
        const finalPrompt = `${systemRole}\n\nUser Question: ${userMessage}`;
        
        // 🚀 เรียก Gemini จริงๆ (ที่เคยหายไป)
        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        const text = response.text();
        
        // พยายามดึง Usage (บาง Model อาจไม่มี metadata นี้)
        const usage = response.usageMetadata || { totalTokenCount: 0 };
        const duration = Date.now() - startTime;

        // บันทึก Log
        _insertLog({
            reqId: reqId,
            page: logContext.pageId,
            action: logContext.action,
            lang: logContext.lang,
            input: userMessage,
            output: text,
            tokens: usage.totalTokenCount,
            savedTokens: 0,
            time: duration,
            savedTime: 0,
            isCached: false
        });

        // ✅ Return Object กลับไป (สำคัญมาก)
        return { 
            text: text, 
            id: reqId, 
            usage: { total_tokens: usage.totalTokenCount || 0 } 
        };

    } catch (error) {
        console.error("❌ Gemini Error:", error.message);
        
        // กรณี Error ต้อง Return โครงสร้างเดียวกัน เพื่อไม่ให้ apiRoutes พัง
        return {
            text: "ขออภัยครับ ระบบ AI ขัดข้องชั่วคราว (Gemini Error)",
            id: reqId,
            usage: { total_tokens: 0 }
        };
    }
}

// ✅ ฟังก์ชัน Log Cache Hit
function logCacheHit(data) {
    _insertLog({
        reqId: data.reqId, page: data.pageId, action: 'cache_view', lang: data.lang,
        input: data.input, output: data.output,
        tokens: 0, savedTokens: data.savedTokens, time: 5, savedTime: data.savedTime || 0,
        isCached: true
    });
}

module.exports = { generateAIResponse, logCacheHit };