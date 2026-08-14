const express = require('express');
const axios = require('axios');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';
const FASTAPI_TIMEOUT_MS = Number(process.env.FASTAPI_TIMEOUT_MS || 30000);
const STREAM_TIMEOUT_MS = Number(process.env.CHAT_STREAM_TIMEOUT_MS || 120000);

const getAuthenticatedUserId = (req) => req.user?.userId || req.user?._id;

router.post('/', requireAuth, async (req, res) => {
  try {
    const { user_message, detected_disease, session_id } = req.body || {};

    if (!user_message || !String(user_message).trim()) {
      return res.status(400).json({ success: false, message: 'user_message is required' });
    }

    const userId = getAuthenticatedUserId(req);
    const resolvedSessionId = session_id || `user_${userId || 'anonymous'}`;

    const upstream = await axios.post(
      `${FASTAPI_URL}/chat`,
      {
        user_message: String(user_message),
        detected_disease: detected_disease || null,
        session_id: String(resolvedSessionId),
      },
      { timeout: FASTAPI_TIMEOUT_MS },
    );

    return res.status(200).json({
      success: true,
      bot_response: upstream.data?.bot_response || '',
    });
  } catch (error) {
    if (error.response) {
      return res.status(502).json({
        success: false,
        message: 'Chatbot service returned an error',
        details: error.response.data,
      });
    }

    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ success: false, message: 'Chatbot service timed out' });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ success: false, message: 'Chatbot service unavailable' });
    }

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

    upstreamStream.on('error', () => {
      res.write('event: error\n');
      res.write('data: {"message":"Upstream chat stream failed"}\n\n');
      res.write('event: done\n');
      res.write('data: {"bot_response":""}\n\n');
      res.end();
    });
  } catch (error) {
    const statusCode = error.response?.status || 502;
    const message =
      error.code === 'ECONNABORTED'
        ? 'Upstream chat stream timed out'
        : error.code === 'ECONNREFUSED'
          ? 'Upstream chat service unavailable'
          : 'Unable to open chat stream';

    res.write('event: error\n');
    res.write(`data: ${JSON.stringify({ message })}\n\n`);
    res.write('event: done\n');
    res.write('data: {"bot_response":""}\n\n');
    res.end();

    if (!res.headersSent) {
      return res.status(statusCode).json({ success: false, message });
    }
  }
});

module.exports = router;
