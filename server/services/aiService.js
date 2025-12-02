const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// 🔴 ตรวจสอบ Key ของคุณตรงนี้อีกครั้งนะครับ
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyA3CLBm2lungU_pFLpKIHnGUmSVx4lPu0w"; 

console.log("🔑 Checking Key:", API_KEY && API_KEY.startsWith("AIza") ? "Found Key starting with " + API_KEY.substring(0, 5) : "No Key Found or Invalid");

const genAI = new GoogleGenerativeAI(API_KEY);

// ✅ ปรับมาใช้ Gemini 2.5 Flash ตัวเดียวตามที่ขอครับ
// รุ่น: gemini-2.5-flash-preview-09-2025 (เร็วและฉลาดที่สุดในตระกูล Flash)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });

async function generateAIResponse(userMessage, systemRole = "You are a helpful assistant.") {
    try {
        console.log("🚀 Sending to Gemini (Model: gemini-2.5-flash-preview-09-2025)...");
        
        const finalPrompt = `${systemRole}\n\nUser Question: ${userMessage}`;

        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        const text = response.text();
        
        console.log("✅ Gemini Replied");
        return text;

    } catch (error) {
        console.error("❌ Gemini Error:", error.message);
        // เพิ่มคำแนะนำเผื่อกรณีโมเดลรุ่น Preview นี้ปิดปรับปรุง
        return "ขออภัยครับ ตอนนี้สมองน้อง Gemini (2.5 Flash) เชื่อมต่อไม่ได้ (อาจจะเพราะเป็นรุ่น Preview หรือ API Key มีปัญหา)";
    }
}

module.exports = { generateAIResponse };