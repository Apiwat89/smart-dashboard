require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/apiRoutes');

const BASE_URL = process.env.BASE_URL_CLINET;

const app = express();
const PORT = process.env.PORT || 3000;

// app.use(cors());
app.use(cors({
    origin: ["http://localhost:5173", `${BASE_URL}`],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'] 
}));
app.use(express.json());

app.use('/api', apiRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));