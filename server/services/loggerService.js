const { BigQuery } = require('@google-cloud/bigquery');
const db = require('../database/database');
require('dotenv').config();

// --- ตั้งค่า BigQuery ---
const bigquery = new BigQuery({
    projectId: process.env.GCP_PROJECT_ID
});

const datasetId = process.env.DATASET_ID;
const tableId = process.env.TABLE_ID; 

// --- ฟังก์ชันแปลงข้อมูลให้ตรงกับ Schema ---
const prepareLogData = (data) => {
    return {
        request_id: data.reqId || 'unknown',
        created_at: bigquery.datetime(new Date().toISOString()), 
        page_name: data.page || 'unknown',
        action_type: data.action || 'general',
        language: data.lang || 'TH',
        input_context: data.input || '',
        ai_response: data.output || '',
        input_tokens: data.input_tokens || 0,
        output_tokens: data.output_tokens || 0,
        total_tokens: data.total_tokens || 0,
        saved_tokens: data.savedTokens || 0,
        start_time_ms: data.startTime || 0,
        end_time_ms: data.endTime || 0,
        processing_time_ms: data.durationTime || 0,
        saved_time_ms: data.savedTime || 0,
        is_cached: data.isCached ? 1 : 0
    };
};

// --- ฟังก์ชันหลักสำหรับบันทึก Log ---
async function insertLogฺBigQuery(data) {
    // บันทึกลง SQLite (เหมือนเดิม - เอาไว้ดูเล่นๆ หรือ Backup)
    const sql = `
        INSERT INTO EzDashboard 
        (request_id, page_name, action_type, language, input_context, ai_response, input_tokens, output_tokens, total_tokens, saved_tokens, start_at, end_at, processing_time_ms, saved_time_ms, is_cached)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
        data.reqId, data.page, data.action, data.lang, data.input, data.output,
        data.input_tokens, data.output_tokens, data.total_tokens,
        data.savedTokens, data.startTime, data.endTime, data.durationTime, data.savedTime, data.isCached ? 1 : 0
    ];

    db.run(sql, params, (err) => {
        if (err) console.error("❌ SQLite Error:", err.message);
    });

    // บันทึกลง BigQuery (เฉพาะตอนอยู่บน Production หรือตั้งค่าเปิดไว้)
    // เช็ค environment variable เพื่อไม่ให้เปลือง Quota ตอน dev
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_BIGQUERY === 'true') {
        try {
            const row = prepareLogData(data);
            
            // ใช้ insert แบบ Streaming (ข้อมูลเข้าทันทีแต่อาจมี cost)
            await bigquery
                .dataset(datasetId)
                .table(tableId)
                .insert([row]);
                
            console.log(`✅ BigQuery Logged: ${data.reqId}`);
        } catch (error) {
            console.error("❌ BigQuery Error:", JSON.stringify(error.errors || error));
        }
    }
}

module.exports = { insertLogฺBigQuery };