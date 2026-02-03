// server/database/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// สร้างไฟล์ logs.db ไว้ในโฟลเดอร์ database
const dbPath = path.resolve(__dirname, 'logs.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database Connection Error:', err.message);
    } else {
        console.log('✅ Connected to SQLite database.');
        initTable();
    }
});

function initTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS ai_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id TEXT,                 
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            page_name TEXT,                  
            action_type TEXT,                
            language TEXT,                   -- 👈 1. เพิ่มตรงนี้ครับ (TH, EN, etc.)
            input_context TEXT,              
            ai_response TEXT,                
            
            -- 💰 Cost (Token)
            total_tokens INTEGER DEFAULT 0,  
            saved_tokens INTEGER DEFAULT 0,  

            -- ⚡ Performance (Time)
            processing_time_ms INTEGER DEFAULT 0, 
            saved_time_ms INTEGER DEFAULT 0,      

            is_cached INTEGER DEFAULT 0      
        )
    `;
    
    db.run(sql, (err) => {
        if (err) console.error("❌ Table Creation Error:", err.message);
    });
}

module.exports = db;