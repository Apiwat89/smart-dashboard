const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'logs.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('DB Error:', err.message);
    else {
        console.log('Connected to SQLite database.');
        initTable();
    }
});

function initTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS EzDashboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id TEXT,                 
            page_name TEXT,                  
            action_type TEXT,                
            language TEXT,
            input_context TEXT,              
            ai_response TEXT,                
            input_tokens INTEGER DEFAULT 0, 
            output_tokens INTEGER DEFAULT 0, 
            total_tokens INTEGER DEFAULT 0,     
            saved_tokens INTEGER DEFAULT 0,     
            start_at DATETIME,
            end_at DATETIME,
            processing_time_ms INTEGER DEFAULT 0, 
            saved_time_ms INTEGER DEFAULT 0,  
            is_cached INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    db.run(sql, (err) => {
        if (err) console.error("Table Error:", err.message);
    });
}

module.exports = db;