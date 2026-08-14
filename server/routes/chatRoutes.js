const express = require('express');
const axios = require('axios');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';
const FASTAPI_TIMEOUT_MS = Number(process.env.FASTAPI_TIMEOUT_MS || 15000);
const STREAM_TIMEOUT_MS = Number(process.env.CHAT_STREAM_TIMEOUT_MS || 30000);

const getAuthenticatedUserId = (req) => req.user?.userId || req.user?._id;

const generateFallbackChatResponse = async (userMessage, detectedDisease) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const msgLower = String(userMessage || '').toLowerCase();
  const disease = detectedDisease || 'Plant Disease Care';

  if (apiKey) {
    const modelsToTry = [
      'gemini-flash-latest',
      'gemini-2.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.7-flash',
    ];

    for (const model of modelsToTry) {
      try {
        const prompt = `You are KrishiMitra AI, a professional agricultural scientist and plant pathologist assistant. 
Context: User is asking about plant health. Detected Disease Context: "${disease}".
User Question: "${userMessage}".
Provide concise, practical, actionable agricultural advice answering the user's specific question directly. Use bullet points and clear formatting.`;

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
          },
          { timeout: 10000 }
        );

        const candidateText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText && candidateText.trim()) {
          return candidateText.trim();
        }
      } catch (geminiError) {
        console.warn(`Gemini model ${model} warning:`, geminiError.message);
      }
    }
  }

  // Enhanced agricultural NLP fallback matching engine
  if (msgLower.includes('fruit') || msgLower.includes('tuber') || msgLower.includes('effect') || msgLower.includes('harvest') || msgLower.includes('yield')) {
    return `**Effect of ${disease} on fruit/yield**:\n• **Tuber/Fruit Damage**: Fungal infections cause dark, sunken, corky rot spots on tubers and fruits.\n• **Yield Loss**: Premature defoliation reduces photosynthesis, leading to significantly smaller fruit size and stunted crop yield.\n• **Post-Harvest Rot**: Infected fruits rot quickly during storage if stored in warm, humid conditions.`;
  }

  if (msgLower.includes('cure') || msgLower.includes('treatment') || msgLower.includes('remedy') || msgLower.includes('heal') || msgLower.includes('fix')) {
    return `For managing and curing **${disease}**:\n1. **Fungicide Spray**: Apply copper-based or chlorothalonil organic fungicides every 7–10 days.\n2. **Pruning**: Trim and safely burn/dispose of heavily infected leaves.\n3. **Irrigation Control**: Water near the roots using drip irrigation; avoid overhead sprinklers to keep leaves dry.`;
  }

  if (msgLower.includes('precaution') || msgLower.includes('prevent') || msgLower.includes('stop') || msgLower.includes('protect')) {
    return `Key preventive measures for **${disease}**:\n• Practice crop rotation with non-solanaceous crops every 2-3 years.\n• Ensure adequate spacing between plants to maximize airflow.\n• Apply preventive neem oil spray every 14 days during warm, humid conditions.`;
  }

  if (msgLower.includes('cause') || msgLower.includes('reason') || msgLower.includes('why') || msgLower.includes('spread')) {
    return `**${disease}** is caused by fungal spores (*Alternaria solani* / *Phytophthora*) thriving in high humidity, wet leaf moisture, and warm temperatures (20°C–30°C). Rain splashing and wind carry spores to healthy plants.`;
  }

  if (msgLower.includes('symptom') || msgLower.includes('identify') || msgLower.includes('look') || msgLower.includes('spot')) {
    return `Common symptoms of **${disease}**:\n• Concentric dark brown "target-like" rings on mature leaves.\n• Yellow halos surrounding leaf spots.\n• Yellowing and drooping of lower foliage.`;
  }

  return `Regarding **${disease}**: For the query "${userMessage}", ensure proper plant hygiene, apply copper-based fungicides if symptoms persist, and keep foliage dry with drip irrigation. Feel free to ask about specific cures, fruit impact, or preventive measures!`;
};

router.post('/', requireAuth, async (req, res) => {
  try {
    const { user_message, detected_disease, session_id } = req.body || {};

    if (!user_message || !String(user_message).trim()) {
      return res.status(400).json({ success: false, message: 'user_message is required' });
    }

    const userId = getAuthenticatedUserId(req);
    const resolvedSessionId = session_id || `user_${userId || 'anonymous'}`;

    try {
      const upstream = await axios.post(
        `${FASTAPI_URL}/chat`,
        {
          user_message: String(user_message),
          detected_disease: detected_disease || null,
          session_id: String(resolvedSessionId),
        },
        { timeout: FASTAPI_TIMEOUT_MS }
      );

      if (upstream.data?.bot_response) {
        return res.status(200).json({
          success: true,
          bot_response: upstream.data.bot_response,
        });
      }
    } catch (upstreamErr) {
      console.warn('FastAPI chat service unavailable, utilizing AI advisor fallback:', upstreamErr.message);
    }

    const fallbackResponse = await generateFallbackChatResponse(user_message, detected_disease);
    return res.status(200).json({
      success: true,
      bot_response: fallbackResponse,
    });
  } catch (error) {
    console.error('Chat endpoint error:', error.message);
    return res.status(500).json({ success: false, message: 'Unexpected chat server error' });
  }
});

router.get('/stream', requireAuth, async (req, res) => {
  const { user_message, detected_disease, session_id } = req.query || {};

  if (!user_message || !String(user_message).trim()) {
    return res.status(400).json({ success: false, message: 'user_message is required' });
  }

  const userId = getAuthenticatedUserId(req);
  const resolvedSessionId = session_id || `user_${userId || 'anonymous'}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let upstreamStream;

  const closeStream = () => {
    if (upstreamStream && !upstreamStream.destroyed) {
      upstreamStream.destroy();
    }
  };

  req.on('close', closeStream);

  try {
    const upstream = await axios.get(`${FASTAPI_URL}/chat/stream`, {
      params: {
        user_message: String(user_message),
        detected_disease: detected_disease || '',
        session_id: String(resolvedSessionId),
      },
      responseType: 'stream',
      timeout: STREAM_TIMEOUT_MS,
      headers: {
        Accept: 'text/event-stream',
      },
    });

    upstreamStream = upstream.data;

    upstreamStream.on('data', (chunk) => {
      res.write(chunk);
    });

    upstreamStream.on('end', () => {
      res.end();
    });

    upstreamStream.on('error', async () => {
      const fallbackText = await generateFallbackChatResponse(user_message, detected_disease);
      res.write('event: token\n');
      res.write(`data: ${JSON.stringify({ text: fallbackText })}\n\n`);
      res.write('event: done\n');
      res.write(`data: ${JSON.stringify({ bot_response: fallbackText })}\n\n`);
      res.end();
    });
  } catch (error) {
    console.warn('FastAPI chat stream unavailable, streaming AI advisor fallback:', error.message);
    try {
      const fallbackText = await generateFallbackChatResponse(user_message, detected_disease);
      
      const words = fallbackText.split(' ');
      let index = 0;
      const interval = setInterval(() => {
        if (index < words.length) {
          const chunk = (index === 0 ? '' : ' ') + words[index];
          res.write('event: token\n');
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
          index++;
        } else {
          clearInterval(interval);
          res.write('event: done\n');
          res.write(`data: ${JSON.stringify({ bot_response: fallbackText })}\n\n`);
          res.end();
        }
      }, 40);
    } catch (fallbackErr) {
      res.write('event: error\n');
      res.write(`data: ${JSON.stringify({ message: 'Chat assistant error' })}\n\n`);
      res.write('event: done\n');
      res.write('data: {"bot_response":""}\n\n');
      res.end();
    }
  }
});

module.exports = router;
