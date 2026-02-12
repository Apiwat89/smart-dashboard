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
        throw err; 
    }
};

module.exports = { fetchAzureSpeechToken };