const express = require('express');
const axios = require('axios');
const { requireAuth } = require('../middleware/authMiddleware');
const ChatSession = require('../models/ChatSession');

const router = express.Router();

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';
const FASTAPI_TIMEOUT_MS = Number(process.env.FASTAPI_TIMEOUT_MS || 15000);
const STREAM_TIMEOUT_MS = Number(process.env.CHAT_STREAM_TIMEOUT_MS || 30000);

const getAuthenticatedUserId = (req) => req.user?.userId || req.user?._id;

// AI 1-line title generator (3-6 words, unique)
const generateTitleWithAI = async (userPrompt, botResponse, detectedDisease) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const cleanPrompt = String(userPrompt || '').trim();

  if (!cleanPrompt) return 'Plant Health Consultation';

  if (apiKey) {
    try {
      const promptText = `Create a single concise 1-line title (3 to 6 words max, no quotes, no markdown, no emojis) summarizing this plant health discussion.
Context Disease: "${detectedDisease || 'Plant Care'}"
User Question: "${cleanPrompt}"
Title:`;

      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        { contents: [{ parts: [{ text: promptText }] }] },
        { timeout: 5000 }
      );

      const candidate = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (candidate) {
        const cleanTitle = candidate.replace(/["'#\n]/g, '').slice(0, 42).trim();
        if (cleanTitle && cleanTitle.length > 3) {
          return cleanTitle;
        }
      }
    } catch (err) {
      console.warn('AI title generation warning:', err.message);
    }
  }

  const snippet = cleanPrompt.length > 25 ? `${cleanPrompt.slice(0, 25)}...` : cleanPrompt;
  return detectedDisease ? `${detectedDisease}: ${snippet}` : snippet;
};

const saveMessageToHistory = async (userId, sessionId, sender, text, detectedDisease = '') => {
  if (!userId || !sessionId || !text) return;
  try {
    const diseaseName = String(detectedDisease || '').trim();
    const cleanText = String(text).trim();

    const existingSession = await ChatSession.findOne({ userId, sessionId });

    // Deduplication check: Do not save identical consecutive user messages in the same session
    if (sender === 'user' && existingSession && existingSession.messages && existingSession.messages.length > 0) {
      const lastMsg = existingSession.messages[existingSession.messages.length - 1];
      if (lastMsg.sender === 'user' && lastMsg.text === cleanText) {
        return;
      }
    }

    let titleToSet = null;
    // Generate AI title on the first Q&A exchange
    if (!existingSession || !existingSession.title || existingSession.title === 'Plant Health Consultation' || (existingSession.messages && existingSession.messages.length <= 1)) {
      if (sender === 'bot') {
        const firstUserMsg = existingSession?.messages?.find((m) => m.sender === 'user')?.text || cleanText;
        titleToSet = await generateTitleWithAI(firstUserMsg, cleanText, diseaseName);
      } else if (sender === 'user') {
        const shortPrompt = cleanText.length > 25 ? `${cleanText.slice(0, 25)}...` : cleanText;
        titleToSet = diseaseName ? `${diseaseName} - ${shortPrompt}` : shortPrompt;
      }
    }

    const setFields = {
      lastMessageAt: new Date(),
      detectedDisease: diseaseName,
    };

    const setOnInsertFields = {
      userId,
      sessionId,
    };

    if (titleToSet) {
      setFields.title = titleToSet;
    } else {
      setOnInsertFields.title = diseaseName ? `${diseaseName} Consultation` : 'Plant Health Consultation';
    }

    await ChatSession.findOneAndUpdate(
      { userId, sessionId },
      {
        $push: {
          messages: {
            sender,
            text: cleanText,
            timestamp: new Date(),
          },
        },
        $set: setFields,
        $setOnInsert: setOnInsertFields,
      },
      { upsert: true, returnDocument: 'after' }
    );
  } catch (err) {
    console.warn('Failed to save chat message to ChatSession DB:', err.message);
  }
};

async function generateFallbackChatResponse(userMessage, diseaseName, targetLanguage = 'English') {
  const disease = diseaseName || 'Crop Health';
  const apiKey = process.env.GOOGLE_API_KEY;
  const msgLower = (userMessage || '').toLowerCase();

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
CRITICAL REQUIREMENT: Respond completely in ${targetLanguage}.
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
    return `### Effect of ${disease} on fruit/yield:\n* **Tuber/Fruit Damage:** Fungal infections cause dark, sunken, corky rot spots on tubers and fruits.\n* **Yield Loss:** Premature defoliation reduces photosynthesis, leading to significantly smaller fruit size and stunted crop yield.\n* **Post-Harvest Rot:** Infected fruits rot quickly during storage if stored in warm, humid conditions.`;
  }

  if (msgLower.includes('cure') || msgLower.includes('treatment') || msgLower.includes('remedy') || msgLower.includes('heal') || msgLower.includes('fix')) {
    return `### Managing and curing ${disease}:\n1. **Fungicide Spray:** Apply copper-based or chlorothalonil organic fungicides every 7–10 days.\n2. **Pruning:** Trim and safely burn/dispose of heavily infected leaves.\n3. **Irrigation Control:** Water near the roots using drip irrigation; avoid overhead sprinklers to keep leaves dry.`;
  }

  if (msgLower.includes('precaution') || msgLower.includes('prevent') || msgLower.includes('stop') || msgLower.includes('protect')) {
    return `### Key preventive measures for ${disease}:\n* Practice crop rotation with non-solanaceous crops every 2-3 years.\n* Ensure adequate spacing between plants to maximize airflow.\n* Apply preventive neem oil spray every 14 days during warm, humid conditions.`;
  }

  if (msgLower.includes('cause') || msgLower.includes('reason') || msgLower.includes('why') || msgLower.includes('spread')) {
    return `### Causes of ${disease}:\n* Caused by fungal/bacterial spores thriving in high humidity, wet leaf moisture, and warm temperatures (20°C–30°C).\n* Rain splashing and wind carry spores to healthy plants.`;
  }

  if (msgLower.includes('symptom') || msgLower.includes('identify') || msgLower.includes('look') || msgLower.includes('spot')) {
    return `### Common symptoms of ${disease}:\n* Concentric dark brown "target-like" rings on mature leaves.\n* Yellow halos surrounding leaf spots.\n* Yellowing and drooping of lower foliage.`;
  }

  return `### Information for ${disease}:\n* Keep foliage dry and irrigate early in the morning.\n* Monitor leaves daily for brown or black leaf spot lesions.\n* Apply protective copper fungicide at the first sign of leaf spots.`;
}

// Fetch chat sessions list (ChatGPT-style sidebar list)
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const sessions = await ChatSession.find({ userId })
      .select('sessionId title detectedDisease lastMessageAt messages')
      .sort({ lastMessageAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      sessions: (sessions || []).map((s) => ({
        sessionId: s.sessionId || '',
        title: s.title || 'Plant Health Consultation',
        detectedDisease: s.detectedDisease || '',
        lastMessageAt: s.lastMessageAt || s.updatedAt || new Date(),
        messageCount: Array.isArray(s.messages) ? s.messages.length : 0,
      })),
    });
  } catch (error) {
    console.error('Fetch sessions list error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
  }
});

// Fetch chat history for a specific session ID
router.get('/history/:sessionId', requireAuth, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { sessionId } = req.params;

    if (!userId || !sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    const session = await ChatSession.findOne({ userId, sessionId }).lean();
    const rawMessages = session?.messages || [];

    const deduplicatedHistory = [];
    for (const m of rawMessages) {
      if (deduplicatedHistory.length > 0) {
        const prev = deduplicatedHistory[deduplicatedHistory.length - 1];
        if (prev.sender === m.sender && prev.text === m.text) {
          continue;
        }
      }
      deduplicatedHistory.push(m);
    }

    return res.status(200).json({
      success: true,
      title: session?.title || 'Plant Health Consultation',
      detectedDisease: session?.detectedDisease || '',
      history: deduplicatedHistory.map((m) => ({
        id: m._id,
        sender: m.sender,
        text: m.text,
        timestamp: m.timestamp || m.createdAt,
      })),
    });
  } catch (error) {
    console.error('Fetch chat history error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch chat history' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { user_message, detected_disease, session_id, language } = req.body || {};

    if (!user_message || !String(user_message).trim()) {
      return res.status(400).json({ success: false, message: 'user_message is required' });
    }

    const userId = getAuthenticatedUserId(req);
    const resolvedSessionId = session_id || `user_${userId || 'anonymous'}`;
    const targetLanguage = language || 'English';

    // Save user message to history
    await saveMessageToHistory(userId, resolvedSessionId, 'user', user_message, detected_disease);

    let botResponse = '';
    let responseSource = 'rag';

    try {
      const upstream = await axios.post(
        `${FASTAPI_URL}/chat`,
        {
          user_message: String(user_message),
          detected_disease: detected_disease || null,
          session_id: String(resolvedSessionId),
          language: targetLanguage,
        },
        { timeout: FASTAPI_TIMEOUT_MS }
      );

      if (upstream.data?.bot_response) {
        botResponse = upstream.data.bot_response;
        console.log('[CHAT SERVICE] ✅ Answer generated via Python FastAPI RAG Pipeline (ChromaDB)');
      }
    } catch (upstreamErr) {
      console.warn('[CHAT SERVICE] ⚠️ FastAPI RAG service unavailable (http://127.0.0.1:8000):', upstreamErr.message);
    }

    if (!botResponse) {
      responseSource = 'fallback';
      console.log('[CHAT SERVICE] ⚡ Using fallback AI advisor engine (Gemini / NLP)');
      botResponse = await generateFallbackChatResponse(user_message, detected_disease, targetLanguage);
    }

    // Save bot response to history & trigger AI title generation on first exchange
    await saveMessageToHistory(userId, resolvedSessionId, 'bot', botResponse, detected_disease);

    return res.status(200).json({
      success: true,
      bot_response: botResponse,
      source: responseSource,
    });
  } catch (error) {
    console.error('Chat endpoint error:', error.message);
    return res.status(500).json({ success: false, message: 'Unexpected chat server error' });
  }
});

router.get('/stream', requireAuth, async (req, res) => {
  const { user_message, detected_disease, session_id, language } = req.query || {};

  if (!user_message || !String(user_message).trim()) {
    return res.status(400).json({ success: false, message: 'user_message is required' });
  }

  const userId = getAuthenticatedUserId(req);
  const resolvedSessionId = session_id || `user_${userId || 'anonymous'}`;
  const targetLanguage = language || 'English';

  // Save user message
  await saveMessageToHistory(userId, resolvedSessionId, 'user', user_message, detected_disease);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let fullBotResponse = '';

  const finalizeAndSave = async (text) => {
    if (text && text.trim()) {
      await saveMessageToHistory(userId, resolvedSessionId, 'bot', text.trim(), detected_disease);
    }
  };

  try {
    const upstream = await axios.get(`${FASTAPI_URL}/chat/stream`, {
      params: {
        user_message: String(user_message),
        detected_disease: detected_disease || '',
        session_id: String(resolvedSessionId),
        language: targetLanguage,
      },
      responseType: 'stream',
      timeout: STREAM_TIMEOUT_MS,
      headers: {
        Accept: 'text/event-stream',
      },
    });

    const upstreamStream = upstream.data;

    upstreamStream.on('data', (chunk) => {
      res.write(chunk);
      // Attempt to extract text for DB persistence
      const chunkStr = chunk.toString();
      if (chunkStr.includes('data:')) {
        try {
          const lines = chunkStr.split('\n');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              const parsed = JSON.parse(line.slice(5).trim());
              if (parsed.text) fullBotResponse += parsed.text;
              if (parsed.bot_response) fullBotResponse = parsed.bot_response;
            }
          }
        } catch {
          // Stream parsing helper fallback
        }
      }
    });

    upstreamStream.on('end', async () => {
      await finalizeAndSave(fullBotResponse);
      res.end();
    });

    upstreamStream.on('error', async () => {
      const fallbackText = await generateFallbackChatResponse(user_message, detected_disease);
      await finalizeAndSave(fallbackText);
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
      await finalizeAndSave(fallbackText);
      
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
      }, 30);
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
