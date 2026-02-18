const OpenAI = require("openai"); 
const db = require('../database/database'); 
const { v4: uuidv4 } = require('uuid'); 
const { insertLogฺBigQuery } = require('./loggerService');
require('dotenv').config();

// Config OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, 
});

const MODEL_NAME = "gpt-5.2"; 

// ฟังก์ชันหลัก
async function generateAIResponse(userMessage, logContext = {}) {
    const startTime = new Date().toISOString();
    const startTimeCal = Date.now();
    const reqId = uuidv4();

    try {
        console.log(`Sending to OpenAI (${MODEL_NAME}) [${logContext.action || 'General'}]...`);

        // 2. เรียก API
        const completion = await openai.chat.completions.create({
            model: MODEL_NAME,
            userMessage: userMessage,
            temperature: 0.7, // ปรับความสร้างสรรค์
        });

        // 3. แกะผลลัพธ์
        const responseText = completion.choices[0].message.content;

        // 4. แกะ Token Usage 
        const usage = completion.usage || {};
        const input_tokens = usage.prompt_tokens || 0;     
        const output_tokens = usage.completion_tokens || 0;
        const total_tokens = usage.total_tokens || 0;     

        const endTime = new Date().toISOString();
        const endTimeCal = Date.now();
        const duration = endTimeCal - startTimeCal;
        
        // แปลงเป็น String เพื่อเก็บใน DB ให้สวยงาม
        const inputLogCheck = `${userMessage}`;

        // 5. บันทึก Log
        insertLogฺBigQuery({
            reqId: reqId,
            page: logContext.pageId,
            action: logContext.action,
            lang: logContext.lang,
            input: inputLogCheck, 
            output: responseText,
            input_tokens: input_tokens,       
            output_tokens: output_tokens, 
            total_tokens: total_tokens,   
            savedTokens: 0,
            startTime: startTime,
            endTime: endTime,
            durationTime: duration,
            savedTime: 0,
            isCached: false
        });

        return { 
            text: responseText, 
            id: reqId, 
            usage: { 
                input_tokens: input_tokens,
                output_tokens: output_tokens,
                total_tokens: total_tokens 
            },
            input: inputLogCheck 
        };

    } catch (error) {
        console.error("❌ OpenAI Error:", error);

        insertLogฺBigQuery({
            reqId: reqId,
            page: logContext.pageId,
            action: logContext.action,
            lang: logContext.lang,
            input: userMessage,
            output: `Error: ${error.message}`,
            input_tokens: 0, output_tokens: 0, total_tokens: 0,
            savedTokens: 0,
            startTime: startTime,
            endTime: Date.now(),
            durationTime: Date.now() - startTime, 
            savedTime: 0, 
            isCached: false
        });

        return {
            text: "ขออภัยครับ ระบบ AI ขัดข้องชั่วคราว",
            id: reqId,
            usage: { total_tokens: 0 },
            input: userMessage
        };
    }
}

// ฟังก์ชัน Cache 
function logCacheHit(data) {
    insertLogฺBigQuery({
        reqId: data.reqId,
        page: data.pageId,
        action: data.action || 'cache_view',
        lang: data.lang,
        input: data.input || 'Cached View',
        output: data.output || 'Displayed from Cache',
        input_tokens: data.inputToken, 
        output_tokens: data.outputToken,
        total_tokens: data.totalToken,
        savedTokens: data.savedTokens,
        startTime: data.startTime || 0,
        endTime: data.endTime || 0,
        durationTime: 0,
        savedTime: data.savedTime || 0,
        isCached: true
    });
}

module.exports = { generateAIResponse, logCacheHit };