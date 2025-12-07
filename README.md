# Smart Dashboard 

สรุปสั้น: โปรเจกต์ตัวอย่างที่ประกอบด้วย
- Frontend: React (Vite)
- Backend: Express (Node.js)
- Integration: เรียกใช้ LLM (Google Generative AI / Gemini) บนเซิร์ฟเวอร์เพื่อสรุปภาพรวมและให้มาสคอตตอบเมื่อคลิกข้อมูล

---

## 1) สร้างโปรเจกต์ตั้งแต่ต้น — คำสั่ง (Windows `cmd.exe`)

1. สร้างโฟลเดอร์โปรเจกต์และเริ่ม Git (ถ้าต้องการ)

```cmd
mkdir "d:\\CPF\\Smart Dashboard\\smart-dashboard"
cd "d:\\CPF\\Smart Dashboard\\smart-dashboard"
git init
```

2. สร้าง backend (Express)

```cmd
mkdir server
cd server
npm init -y
npm install express cors dotenv @google/generative-ai openai
```

จากนั้นสร้างไฟล์สำคัญภายใน `server/`:
- `server.js` — main server และ API endpoints
- `services/aiService.js` — wrapper สำหรับเรียก LLM
- `.env` — เก็บ `GEMINI_API_KEY`

ตัวอย่างสั้น ๆ ของ `server.js`:

```js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { generateAIResponse } = require('./services/aiService');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/summarize-view', async (req, res) => { /* ... */ });
app.post('/api/character-reaction', async (req, res) => { /* ... */ });

app.listen(3000, () => console.log('Server running on port 3000'));
```

3. สร้าง frontend ด้วย Vite + React

จากโฟลเดอร์รากโปรเจกต์:

```cmd
npm create vite@latest client -- --template react
cd client
npm install
```

ติดตั้งไลบรารีที่โปรเจกต์นี้ใช้ (ตัวอย่าง):

```cmd
npm install axios recharts react-intersection-observer lucide-react framer-motion clsx tailwind-merge
npm install -D @vitejs/plugin-react
```

4. (แนะนำ) ตั้งค่า proxy ใน `client/vite.config.js`

เพื่อให้เรียก `/api` ในช่วงพัฒนาและส่งต่อไปยัง `http://localhost:3000`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

5. สร้างไฟล์ `.env` ใน `server/` และใส่คีย์

```
GEMINI_API_KEY=your_real_api_key_here
```

6. รันโปรเจกต์ (สองเทอร์มินัล)

```cmd
// Terminal 1: run server
cd d:\\CPF\\Smart Dashboard\\smart-dashboard\\server
npm start

// Terminal 2: run client
cd d:\\CPF\\Smart Dashboard\\smart-dashboard\\client
npm run dev
```

---

## 2) โครงสร้างโปรเจกต์ (ไฟล์และโฟลเดอร์สำคัญ)

```
smart-dashboard/
├─ client/                  # React app (Vite)
│  ├─ public/
│  └─ src/
│     ├─ components/
│     │  ├─ MainChart.jsx        # แสดงกราฟ + จัดการคลิก
│     │  ├─ CharacterZone.jsx    # มาสคอต + ปุ่มภาษา
│     │  └─ ResultBox.jsx        # กล่องข้อความสรุป
│     ├─ App.jsx                 # layout + logic (detect visible charts, call APIs)
│     ├─ main.jsx
│     └─ App.css
├─ server/                  # Express backend
│  ├─ services/
│  │  └─ aiService.js          # wrapper เรียก LLM (@google/generative-ai)
│  ├─ server.js                # API endpoints
│  ├─ package.json
│  └─ .env                     # GEMINI_API_KEY (local only)
└─ README.md
```

---

## 3) อธิบายว่าโปรเจกต์นี้ทำอะไร (สั้น ๆ เป็นข้อ)

1. แสดงกราฟ (bar, line, area, pie) ด้วยข้อมูลตัวอย่าง เพื่อให้ผู้ใช้ดูภาพรวมต่าง ๆ
2. ตรวจจับกราฟที่ผู้ใช้เห็นบนหน้าจอ (Intersection Observer) แล้วส่งชื่อกราฟไปให้ backend เพื่อให้ LLM สรุปภาพรวมแบบเป็นข้อ ๆ
3. เมื่่อคลิกที่จุดข้อมูล (bar, point, slice) จะส่งข้อมูลจุดนั้นและบริบทของกราฟไปที่ backend เพื่อให้ LLM ตอบกลับเป็นข้อความสั้นของมาสคอต (เช่น ชมเชย ให้กำลังใจ หรือเปรียบเทียบค่ากับเพื่อนร่วมกราฟ)
4. แสดงสถานะมาสคอต (idle → thinking → talking) ระหว่างการประมวลผล

---

## 4) ไฟล์สำคัญ — คำอธิบายสั้น ๆ

- `client/src/components/MainChart.jsx` — ห่อ `recharts` และ normalize ข้อมูลเมื่อคลิกเป็น `{ name, uv }` ส่งไปยัง `App.jsx` เพื่อเรียก API
- `client/src/components/CharacterZone.jsx` — UI มาสคอต มีปุ่มเลือกภาษาและสเตตัส
- `client/src/components/ResultBox.jsx` — แสดงข้อความสรุปจาก LLM
- `client/src/App.jsx` — รวมทุกส่วน: ตรวจจับ visible charts, เรียก `POST /api/summarize-view`, รับการตอบกลับและแสดงใน `ResultBox` และจัดการ onclick ของกราฟเพื่อเรียก `POST /api/character-reaction`
- `server/services/aiService.js` — wrapper สำหรับเรียก Google Generative AI (อ่าน `GEMINI_API_KEY` จาก `process.env`)
- `server/server.js` — ประกาศ endpoint, รับ payload, สร้าง prompt แล้วเรียก `aiService` เพื่อรับข้อความจาก LLM

---

## 5) การตั้งค่าเพิ่มเติม & ข้อควรระวัง

- อย่า commit `.env` ที่มีคีย์จริงขึ้น repo สาธารณะ — ให้ใช้ `.env.example` แทนและเพิ่ม `.env` ใน `.gitignore`
- ถ้า frontend เรียก `/api` ไม่ได้ ให้เรียกด้วย `http://localhost:3000/api/...` หรือกำหนด proxy ใน `vite.config.js`
- ตรวจสอบว่า `GEMINI_API_KEY` ถูกต้องและมีสิทธิ์ใช้โมเดลที่ตั้งไว้ใน `aiService.js` (ไฟล์นี้อาจกำหนด model เป็น `gemini-1.5-flash` หรืออื่น ๆ)

---

## 6) คำสั่งสั้น ๆ สำหรับรีเช็ค (Quick commands)

```cmd
// ติดตั้ง dependencies server
cd server
npm install

// ติดตั้ง dependencies client
cd ..\client
npm install

// รัน server
cd ..\server
npm start

// รัน client (เปิด terminal ใหม่)
cd ..\client
npm run dev
```

---

ตัวเลือกการปรับปรุงเพิ่มเติม (สามารถทำได้):
- เพิ่ม `client/vite.config.js` proxy เพื่อส่งต่อ `/api` ไปที่ `http://localhost:3000`
- สร้าง `server/.env.example` และเพิ่ม `.env` ใน `.gitignore` เพื่อลดความเสี่ยงในการเผยคีย์
- เพิ่มสคริปต์ root-level (`start:all`) โดยใช้แพ็กเกจ `concurrently` เพื่อรัน client และ server พร้อมกัน