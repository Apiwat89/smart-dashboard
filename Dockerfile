# ==========================================
#  Stage 1: Build ฝั่ง Client (React/Vite)
# ==========================================
# ใช้ Node.js เวอร์ชัน 18 เป็นฐาน
FROM node:18-alpine AS frontend-builder

# เข้าไปทำงานในโฟลเดอร์ client
WORKDIR /app/client

# Copy ไฟล์ package.json ของ Client ไป install ก่อน
COPY client/package*.json ./
RUN npm install

# Copy โค้ดทั้งหมดของ Client ไปแล้วสั่ง Build
COPY client/ ./
RUN npm run build
# (ผลลัพธ์ที่ได้จะไปอยู่ในโฟลเดอร์ /app/client/dist)


# ==========================================
#  Stage 2: Setup ฝั่ง Server (Node.js)
# ==========================================
# เริ่มต้น Environment ใหม่สำหรับ Server
FROM node:18-alpine

WORKDIR /app

# เข้าไปทำงานในโฟลเดอร์ server
COPY server/package*.json ./server/
WORKDIR /app/server

# Install เฉพาะของที่ต้องใช้รันจริง (ไม่เอา devDependencies)
RUN npm install --production

# Copy โค้ด Server ทั้งหมด
COPY server/ ./

#  ไฮไลท์สำคัญ: ไปขโมยไฟล์หน้าเว็บที่ Build เสร็จแล้วจาก Stage 1 (frontend-builder)
# เอามาวางไว้ในโฟลเดอร์ public ของ Server เพื่อให้ Node.js เปิดอ่านได้
COPY --from=frontend-builder /app/client/dist ./public

# ตั้งค่า Port ให้ตรงกับที่ Google Cloud Run ชอบ (8080)
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# คำสั่งกดปุ่ม Start Server
CMD ["node", "server/server.js"]