const axios = require('axios');
require('dotenv').config();

const fetchAzureSpeechToken = async () => {
    const speechKey = process.env.SPEECH_KEY;
    const speechRegion = process.env.SPEECH_REGION;

    if (!speechKey || !speechRegion) {
        throw new Error('Speech Key or Region is missing in .env');
    }

    try {
        const tokenResponse = await axios.post(
            `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, 
            null, 
            { 
                headers: { 
                    'Ocp-Apim-Subscription-Key': speechKey, 
                    'Content-Type': 'application/x-www-form-urlencoded' 
                } 
            }
        );

        return { 
            token: tokenResponse.data, 
            region: speechRegion 
        };

    } catch (err) {
        console.error("❌ Azure Service Error:", err.message);
        throw err; // โยน Error กลับไปให้ Controller จัดการ
    }
};

const generateElevenLabsSpeech = async (text, lang) => {
    const API_KEY = process.env.ELEVEN_API_KEY;

    // ย้าย Config มาไว้ในนี้ ให้ Controller สะอาดๆ
    const VOICE_MAP = {
        'TH': process.env.ELEVEN_VOICE_ID,
        'JP': process.env.ELEVEN_VOICE_ID, 
        'EN': process.env.ELEVEN_VOICE_ID, 
        'CN': process.env.ELEVEN_VOICE_ID,
        'KR': process.env.ELEVEN_VOICE_ID,
        'VN': process.env.ELEVEN_VOICE_ID,
        'default': process.env.ELEVEN_VOICE_ID 
    };      

    const selectedVoiceId = VOICE_MAP[lang] || VOICE_MAP['default'];

    try {
        const response = await axios({
            method: 'post',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
            headers: {
                'Accept': 'audio/mpeg',
                'xi-api-key': API_KEY,
                'Content-Type': 'application/json'
            },
            data: {
                text: text,
                model_id: "eleven_v3",
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            },
            responseType: 'stream' // รับค่าเป็น Stream
        });

        return response.data; // ส่ง Stream กลับไปให้ Controller

    } catch (err) {
        // 🛡️ จัดการ Error ที่นี่เลย (Controller จะได้ไม่ต้องเขียนยาวๆ)
        const status = err.response?.status || 500;
        console.error(`❌ ElevenLabs Error (${status}):`);

        // พยายามอ่าน Error message จาก Stream (ถ้ามี)
        if (err.response?.data) {
             err.response.data.on('data', (chunk) => {
                 console.error("👉 Server ตอบว่า:", chunk.toString());
             });
        } else {
             console.error("👉", err.message);
        }

        throw err; // โยน Error ต่อไปเพื่อให้ Controller รู้ว่าพัง
    }
};

module.exports = { fetchAzureSpeechToken, generateElevenLabsSpeech };