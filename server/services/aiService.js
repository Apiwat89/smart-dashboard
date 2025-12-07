const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY; 
console.log("Checking Key:", API_KEY && API_KEY.startsWith("AIza") ? "Found Key starting with " + API_KEY.substring(0, 5) : "No Key Found or Invalid");
const genAI = new GoogleGenerativeAI(API_KEY);

// gemini-2.5-flash-preview-09-2025
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });
async function generateAIResponse(userMessage, systemRole = "You are a helpful assistant.") {
    try {
        console.log("Sending to Gemini (Model: gemini-2.5-flash-preview-09-2025)...");
        
        const finalPrompt = `${systemRole}\n\nUser Question: ${userMessage}`;

        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        const text = response.text();
    
        console.log("✅ Gemini Replied");
        return text;
    } catch (error) {
        console.error("❌ Gemini Error:", error.message);
        return "Sorry, but Gemini's brain (2.5 Flash) is currently not connected (maybe because it's a preview version or the API key has a problem).";
    }
}

module.exports = { generateAIResponse };