const OpenAI = require("openai"); 
const db = require('../database/database'); 
const { v4: uuidv4 } = require('uuid'); 
const { insertLogฺBigQuery } = require('./loggerService'); // ตรวจสอบชื่อฟังก์ชันให้ตรงกับที่คุณใช้อยู่
require('dotenv').config();

// Config OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, 
});

const MODEL_NAME = "gpt-5.2"; 

async function generateAIResponse(messages, logContext = {}) {
    const startTime = new Date().toISOString();
    const startTimeCal = Date.now();
    const reqId = uuidv4();

    // 1. จัดการข้อความก่อนเรียก AI (บีบอัดช่องว่าง และป้องกัน object object)
    let compressedPrompt = "";
    try {
        compressedPrompt = JSON.stringify(messages).replace(/\s+/g, ' ');
    } catch (e) {
        compressedPrompt = "Error parsing messages";
    }

    try {
        console.log(`Sending to OpenAI (${MODEL_NAME}) [${logContext.action || 'General'}]...`);

        // 2. เรียก API
        const completion = await openai.chat.completions.create({
            model: MODEL_NAME,
            messages: messages, 
            temperature: 0.7, 
        });

        // 3. แกะผลลัพธ์
        const responseText = completion.choices[0].message.content;

        // 4. แกะ Token Usage 
        const usage = completion.usage || {};
        const input_tokens = usage.prompt_tokens || 0;     
        const output_tokens = usage.completion_tokens || 0;
        const total_tokens = usage.total_tokens || 0;     

        const endTime = new Date().toISOString();
        const duration = Date.now() - startTimeCal;
        
        // 5. บันทึก Log
        insertLogฺBigQuery({
            reqId: reqId,
            page: logContext.pageId,
            action: logContext.action,
            lang: logContext.lang,
            input: compressedPrompt, // ✅ ส่งก้อนที่บีบอัดแล้วไปเก็บ จะได้ไม่เป็น \n ยาวๆ
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
            input: compressedPrompt // ✅ แก้ Error ตรงนี้เรียบร้อย
        };

    } catch (error) {
        console.error("❌ OpenAI Error:", error);

        insertLogฺBigQuery({
            reqId: reqId,
            page: logContext.pageId,
            action: logContext.action,
            lang: logContext.lang,
            input: compressedPrompt, // ✅ แก้ Error ตรงนี้เรียบร้อย
            output: `Error: ${error.message}`,
            input_tokens: 0, output_tokens: 0, total_tokens: 0,
            savedTokens: 0,
            startTime: startTime,
            endTime: new Date().toISOString(),
            durationTime: Date.now() - startTimeCal, 
            savedTime: 0, 
            isCached: false
        });

        return {
            text: "ขออภัยครับ ระบบ AI ขัดข้องชั่วคราว",
            id: reqId,
            usage: { total_tokens: 0 },
            input: compressedPrompt
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