require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// app.use(cors());
app.use(cors({
    origin: ["https://smart-dashboard-lqs5.vercel.app", "http://localhost:5173"], // ใส่ลิงก์ Vercel ของคุณ
    credentials: true
}));
app.use(express.json());

app.use('/api', apiRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));