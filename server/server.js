require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/apiRoutes');

// const BASE_URL = process.env.BASE_URL_CLINET;

const app = express();
const PORT = process.env.PORT || 8080;

// app.use(cors());
app.use(cors({
    origin: true,
    // origin: ["http://localhost:5173", 
    //     // `${BASE_URL}`
    // ],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'] 
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api', apiRoutes);

// 👇 1. บอกให้ Express เสิร์ฟไฟล์จากโฟลเดอร์ public
app.use(express.static(path.join(__dirname, 'public')));

// 👇 2. แก้ไขบรรทัดนี้ครับ (จาก '*' เป็น '(.*)')
app.get('(.*)', (req, res) => {
    // ใช้ path.join แบบนี้ปลอดภัยที่สุดใน Docker
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ส่วน listen ของคุณถูกต้องแล้วครับ (ใช้ PORT และ 0.0.0.0)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});