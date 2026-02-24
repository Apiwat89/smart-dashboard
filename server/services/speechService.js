const textToSpeech = require('@google-cloud/text-to-speech');
const axios = require('axios');
require('dotenv').config();

// ฟังก์ชันสร้างเสียงด้วย Azure (คุณ Niwat)
const generateAzureSpeech = async (text, lang) => {
    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION;

    if (!speechKey || !speechRegion) throw new Error('Missing Azure Speech credentials in .env');

    const voiceConfigs = {
        'TH': { name: 'th-TH-NiwatNeural', lang: 'th-TH', style: 'default', pitch: '0%', rate: '-5%' },
        'EN': { name: 'en-US-DavisNeural', lang: 'en-US', style: 'cheerful', pitch: '0%', rate: '+5%' },
        'JP': { name: 'ja-JP-KeitaNeural', lang: 'ja-JP', style: 'default', pitch: '0%', rate: '+5%' },
        'CN': { name: 'zh-CN-YunxiNeural', lang: 'zh-CN', style: 'default', pitch: '0%', rate: '+5%' },
        'KR': { name: 'ko-KR-InJoonNeural', lang: 'ko-KR', style: 'default', pitch: '0%', rate: '+5%' },
        'VN': { name: 'vi-VN-NamMinhNeural', lang: 'vi-VN', style: 'default', pitch: '0%', rate: '+5%' }
    };
    const config = voiceConfigs[lang] || voiceConfigs['TH'];

    // สร้างโครงสร้าง SSML สำหรับ Azure
    const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${config.lang}">
            <voice name="${config.name}">
                <mstts:express-as style="${config.style}" styledegree="2">
                    <prosody rate="${config.rate}" pitch="${config.pitch}">${text}</prosody>
                </mstts:express-as>
            </voice>
        </speak>`;

    try {
        // ยิง REST API ไปขอไฟล์เสียง MP3 ตรงๆ จาก Azure
        const response = await axios({
            method: 'post',
            url: `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
            headers: {
                'Ocp-Apim-Subscription-Key': speechKey,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3', // ขอไฟล์เป็น MP3
                'User-Agent': 'EZDashboard'
            },
            data: ssml,
            responseType: 'arraybuffer' // สำคัญมาก! ต้องรับค่าเป็น Binary
        });

        // คืนค่าไฟล์เสียงเป็น Base64
        return Buffer.from(response.data).toString('base64');
    } catch (err) {
        console.error("❌ Azure TTS Error:", err.response ? err.response.data.toString() : err.message);
        throw err;
    }
};

// ฟังก์ชันสร้างเสียงด้วย Google Cloud TTS
const generateGoogleSpeech = async (text, lang) => {
    const client = new textToSpeech.TextToSpeechClient({
        projectId: process.env.GCP_PROJECT_ID, 
        keyFilename: process.env.GCP_SPEECH_KEY  
    });

    // แปลงข้อความธรรมดา ให้กลายเป็น SSML
    let cleanText = text;
    cleanText = cleanText.replace(/<[^>]*>?/gm, ' '); 
    cleanText = cleanText.replace(/[*|()=“”"']/g, ' '); 
    cleanText = cleanText.replace(/&/g, '&amp;');
    cleanText = cleanText.replace(/</g, '&lt;');
    cleanText = cleanText.replace(/>/g, '&gt;');
    cleanText = cleanText.replace(/,\s+(?!\d)/g, ',__PAUSE_300__');
    cleanText = cleanText.replace(/(?<!\d)\.(?!\d)\s*/g, '.__PAUSE_500__');
    cleanText = cleanText.replace(/\n+/g, '__PAUSE_500__');
    cleanText = cleanText.replace(/ /g, '<break time="10ms"/>');
    cleanText = cleanText.replace(/__PAUSE_300__/g, '<break time="300ms"/>');
    cleanText = cleanText.replace(/__PAUSE_500__/g, '<break time="500ms"/>');

    // 3. ห่อข้อความด้วย Tag <speak>
    const ssmlText = `<speak>${cleanText}</speak>`;
    
    const voiceConfigs = {
        'TH': { languageCode: 'th-TH', name: 'th-TH-Chirp3-HD-Achird' }, 
        'EN': { languageCode: 'en-US', name: 'en-US-Neural2-J' }, 
        'JP': { languageCode: 'ja-JP', name: 'ja-JP-Neural2-C' }, 
        'CN': { languageCode: 'cmn-CN', name: 'cmn-CN-Wavenet-C' }, 
        'KR': { languageCode: 'ko-KR', name: 'ko-KR-Neural2-C' }, 
        'VN': { languageCode: 'vi-VN', name: 'vi-VN-Neural2-D' }   
    };
    
    const config = voiceConfigs[lang] || voiceConfigs['TH'];

    const request = {
        input: { ssml: ssmlText }, 
        voice: config,
        audioConfig: { 
            audioEncoding: 'MP3',
            speakingRate: 1.05, 
            pitch: 0 
        },
    };

    try {
        const [response] = await client.synthesizeSpeech(request);
        return response.audioContent.toString('base64');
    } catch (err) {
        console.error("❌ Google TTS Error:", err.message);
        throw err; 
    }
};

module.exports = { generateAzureSpeech, generateGoogleSpeech };