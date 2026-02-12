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
    origin: ["http://localhost:5173", 
        // `${BASE_URL}`
    ],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'] 
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api', apiRoutes);

// 👇 1. บอกให้ Express เสิร์ฟไฟล์จากโฟลเดอร์ public (ที่ React Build มาวาง)
app.use(express.static(path.join(__dirname, 'public')));

// 👇 2. ถ้าหา API ไม่เจอ ให้ส่งหน้าเว็บ React ไปแทน (แก้ปัญหา Refresh แล้วหน้าขาว)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});