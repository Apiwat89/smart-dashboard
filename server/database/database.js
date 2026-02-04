// server/database/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'logs.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('❌ DB Error:', err.message);
    else {
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
            language TEXT,
            input_context TEXT,              
            ai_response TEXT,                
            
            -- 💰 Cost: เก็บครบ 3 พี่น้อง (Input / Output / Total)
            input_tokens INTEGER DEFAULT 0,      -- ขาเข้า
            output_tokens INTEGER DEFAULT 0,  -- ขาออก
            total_tokens INTEGER DEFAULT 0,       -- ผลรวม (Input + Output)
            
            saved_tokens INTEGER DEFAULT 0,       -- ยอดที่ประหยัดได้ (จาก Cache)

            -- ⚡ Performance
            processing_time_ms INTEGER DEFAULT 0, 
            saved_time_ms INTEGER DEFAULT 0,      

            is_cached INTEGER DEFAULT 0      
        )
    `;
    
    db.run(sql, (err) => {
        if (err) console.error("❌ Table Error:", err.message);
    });
}

module.exports = db;