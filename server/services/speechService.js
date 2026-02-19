// const axios = require('axios');
// require('dotenv').config();

// const fetchAzureSpeechToken = async () => {
//     const speechKey = process.env.SPEECH_KEY;
//     const speechRegion = process.env.SPEECH_REGION;

//     if (!speechKey || !speechRegion) {
//         throw new Error('Speech Key or Region is missing in .env');
//     }

//     try {
//         const tokenResponse = await axios.post(
//             `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, 
//             null, 
//             { 
//                 headers: { 
//                     'Ocp-Apim-Subscription-Key': speechKey, 
//                     'Content-Type': 'application/x-www-form-urlencoded' 
//                 } 
//             }
//         );

//         return { 
//             token: tokenResponse.data, 
//             region: speechRegion 
//         };

//     } catch (err) {
//         console.error("❌ Azure Service Error:", err.message);
//         throw err; 
//     }
// };

// module.exports = { fetchAzureSpeechToken };






const textToSpeech = require('@google-cloud/text-to-speech');
require('dotenv').config();

// ใช้ Credentials ตัวเดียวกับ BigQuery ได้เลยครับ
const client = new textToSpeech.TextToSpeechClient({
    projectId: process.env.GCP_PROJECT_ID, 
    keyFilename: process.env.GCP_SPEECH_ID  
});

// เปลี่ยนฟังก์ชันรับ ข้อความ(text) และ ภาษา(lang)
const generateGoogleSpeech = async (text, lang) => {
    // 1. กำหนดเสียงผู้ชาย (Mascot) ของ Google ตามภาษาต่างๆ
    const voiceConfigs = {
        'TH': { languageCode: 'th-TH', name: 'th-TH-Chirp3-HD-Achird' },  // ไทย - ผู้ชาย
        'EN': { languageCode: 'en-US', name: 'en-US-Neural2-D' },  // อังกฤษ - ผู้ชาย
        'JP': { languageCode: 'ja-JP', name: 'ja-JP-Neural2-C' },  // ญี่ปุ่น - ผู้ชาย
        'CN': { languageCode: 'cmn-CN', name: 'cmn-CN-Wavenet-C' }, // จีน - ผู้ชาย
        'KR': { languageCode: 'ko-KR', name: 'ko-KR-Neural2-C' },  // เกาหลี - ผู้ชาย
        'VN': { languageCode: 'vi-VN', name: 'vi-VN-Neural2-D' }   // เวียดนาม - ผู้ชาย
    };
    
    const config = voiceConfigs[lang] || voiceConfigs['TH'];

    const request = {
        input: { text: text },
        voice: config,
        audioConfig: { 
            audioEncoding: 'MP3',
            speakingRate: 1.05, // ปรับให้พูดเร็วขึ้นนิดนึงจะได้ดูคล่องแคล่ว
            pitch: 0 
        },
    };

    try {
        const [response] = await client.synthesizeSpeech(request);
        // คืนค่าไฟล์เสียงเป็น Base64
        return response.audioContent.toString('base64');
    } catch (err) {
        console.error("❌ Google TTS Error:", err.message);
        throw err; 
    }
};

module.exports = { generateGoogleSpeech }; // คืนค่าฟังก์ชันใหม่





// const axios = require('axios');
// require('dotenv').config();

// // ฟังก์ชันแปลงเสียงดิบ (raw PCM 24kHz) จาก Gemini ให้เป็นไฟล์ WAV ปกติ
// function addWavHeader(pcmBuffer) {
//     const sampleRate = 24000;
//     const numChannels = 1;
//     const bitsPerSample = 16;
//     const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
//     const blockAlign = numChannels * (bitsPerSample / 8);
//     const dataSize = pcmBuffer.length;
    
//     const wavBuffer = Buffer.alloc(44 + dataSize);
    
//     wavBuffer.write('RIFF', 0);
//     wavBuffer.writeUInt32LE(36 + dataSize, 4);
//     wavBuffer.write('WAVE', 8);
//     wavBuffer.write('fmt ', 12);
//     wavBuffer.writeUInt32LE(16, 16); // Subchunk1Size
//     wavBuffer.writeUInt16LE(1, 20);  // AudioFormat (PCM)
//     wavBuffer.writeUInt16LE(numChannels, 22);
//     wavBuffer.writeUInt32LE(sampleRate, 24);
//     wavBuffer.writeUInt32LE(byteRate, 28);
//     wavBuffer.writeUInt16LE(blockAlign, 32);
//     wavBuffer.writeUInt16LE(bitsPerSample, 34);
//     wavBuffer.write('data', 36);
//     wavBuffer.writeUInt32LE(dataSize, 40);
    
//     pcmBuffer.copy(wavBuffer, 44);
//     return wavBuffer;
// }

// const generateGeminiSpeech = async (text, lang) => {
//     const apiKey = process.env.GEMINI_API_KEY;
//     if (!apiKey) throw new Error('Missing GEMINI_API_KEY in .env');

//     // เลือกเสียงผู้ชายของ Gemini (Puck เป็นเสียงผู้ชายที่เป็นมิตรสุด)
//     const voiceName = "Fenrir"; 

//     const url = `https://generativelanguage.googleapis.com/v1alpha/models/gemini-2.0-flash:generateContent?key=${apiKey}`;          

//     const payload = {
//         contents: [{
//             role: "user",
//             parts: [{ text: text }]
//         }],
//         generationConfig: {
//             responseModalities: ["AUDIO"],
//             speechConfig: {
//                 voiceConfig: {
//                     prebuiltVoiceConfig: {
//                         voiceName: voiceName
//                     }
//                 }
//             }
//         }
//     };

//     try {
//         const response = await axios.post(url, payload, {
//             headers: { 'Content-Type': 'application/json' }
//         });

//         // 1. ดึง Base64 เสียงดิบออกมา
//         const inlineData = response.data.candidates[0].content.parts[0].inlineData;
//         const pcmBase64 = inlineData.data;
        
//         // 2. แปลงเป็น Buffer และใส่หัวไฟล์ WAV
//         const pcmBuffer = Buffer.from(pcmBase64, 'base64');
//         const wavBuffer = addWavHeader(pcmBuffer);
        
//         // 3. ส่งคืน Base64 (WAV) กลับไปให้หน้าเว็บ
//         return wavBuffer.toString('base64');
        
//     } catch (err) {
//         console.error("❌ Gemini TTS Error:", err.response ? err.response.data : err.message);
//         throw err;
//     }
// };

// module.exports = { generateGeminiSpeech };