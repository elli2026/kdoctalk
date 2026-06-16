const crypto = require('crypto');

// Create self-signed JWT for Google Cloud auth
function createJWT(creds) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: creds.client_email,
    sub: creds.client_email,
    aud: 'https://texttospeech.googleapis.com/',
    iat: now,
    exp: now + 3600,
  })).toString('base64url');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(header + '.' + payload);
  const signature = sign.sign(creds.private_key, 'base64url');
  return header + '.' + payload + '.' + signature;
}

// Voice mapping: language + gender → Google voice name
const VOICES = {
  'ko-f': { code: 'ko-KR', name: 'ko-KR-Wavenet-A' },
  'ko-m': { code: 'ko-KR', name: 'ko-KR-Wavenet-C' },
  'en-f': { code: 'en-US', name: 'en-US-Wavenet-F' },
  'en-m': { code: 'en-US', name: 'en-US-Wavenet-D' },
  'ja-f': { code: 'ja-JP', name: 'ja-JP-Wavenet-B' },
  'ja-m': { code: 'ja-JP', name: 'ja-JP-Wavenet-C' },
  'zh-CN-f': { code: 'cmn-CN', name: 'cmn-CN-Wavenet-A' },
  'zh-CN-m': { code: 'cmn-CN', name: 'cmn-CN-Wavenet-B' },
  'zh-TW-f': { code: 'cmn-TW', name: 'cmn-TW-Wavenet-A' },
  'zh-TW-m': { code: 'cmn-TW', name: 'cmn-TW-Wavenet-B' },
};

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text, lang, gender } = req.body;
  if (!text || !lang) return res.status(400).json({ error: "Missing text or lang" });

  const g = gender || 'f';
  const voiceKey = `${lang}-${g}`;
  const voice = VOICES[voiceKey] || VOICES['ko-f'];

  try {
    const creds = JSON.parse(process.env.GOOGLE_TTS_CREDENTIALS);
    const jwt = createJWT(creds);

    const ttsRes = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: voice.code, name: voice.name },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 0.9 },
      }),
    });

    const data = await ttsRes.json();

    if (data.audioContent) {
      return res.status(200).json({ audio: data.audioContent });
    } else {
      console.error('TTS error:', data);
      return res.status(500).json({ error: 'TTS failed', detail: data.error?.message });
    }
  } catch (err) {
    console.error('TTS error:', err);
    return res.status(500).json({ error: 'TTS failed' });
  }
};
