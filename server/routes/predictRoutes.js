const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const { requireAuth } = require('../middleware/authMiddleware');
const upload = require('../utils/uploadConfig');
const { uploadBufferToCloudinary } = require('../utils/cloudinary');
const Diagnosis = require('../models/Diagnosis');

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';
const FASTAPI_TIMEOUT_MS = Number(process.env.FASTAPI_TIMEOUT_MS || 15000);
const getAuthenticatedUserId = (req) => req.user?.userId || req.user?._id;
const getRequestSource = (req) => {
    const sourceHeader = req.headers['x-request-source'];
    const sourceBody = req.body?.source;
    const source = String(sourceHeader || sourceBody || 'dashboard').toLowerCase();

    if (source === 'landing' || source === 'dashboard') {
        return source;
    }

    return 'dashboard';
};

const normalizePrediction = (payload = {}) => {
    const diseaseName = payload.diseaseName || payload.disease || payload.prediction || 'Unknown';
    const rawConfidence = Number(payload.confidence ?? payload.score ?? 0);
    const confidence = rawConfidence > 1 ? rawConfidence / 100 : rawConfidence;

    return {
        diseaseName,
        confidence: Number.isFinite(confidence) ? confidence : 0,
        modelMeta: payload.modelMeta || null,
    };
};

router.post('/diagnose', upload.single('leafImage'), async (req, res) => {
    const requestSource = getRequestSource(req);
    const requireAuthForRequest = requestSource !== 'landing';

    const runDiagnosis = async () => {
        try{
            const userId = getAuthenticatedUserId(req);

            if (requireAuthForRequest && !userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            if (!req.file) {
                return res.status(400).json({ success: false, message: 'leafImage is required' });
            }

            const cloudinaryResult = await uploadBufferToCloudinary(req.file.buffer, {
                public_id: `diagnosis-${Date.now()}`,
            });

            const form = new FormData();
            form.append('file', req.file.buffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype,
            });

            const fastApiResponse = await axios.post(`${FASTAPI_URL}/predict`, form, {
                headers: form.getHeaders(),
                timeout: FASTAPI_TIMEOUT_MS,
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
            });

            const normalizedPrediction = normalizePrediction(fastApiResponse.data);
            const imageUrl = cloudinaryResult.secure_url;

            let savedDiagnosis = null;
            if (userId) {
                savedDiagnosis = await Diagnosis.create({
                    user: userId,
                    imageUrl,
                    cloudinaryUrl: imageUrl,
                    diseaseName: normalizedPrediction.diseaseName,
                    confidence: normalizedPrediction.confidence,
                });
            }

            res.status(200).json({ 
                success: true,
                message: 'Diagnosis completed successfully',
                source: requestSource,
                data: savedDiagnosis,
                prediction: normalizedPrediction,
            });
        } catch (error) {
            if (error.response) {
                return res.status(502).json({
                    success: false,
                    message: 'Model service returned an error',
                    details: error.response.data,
                });
            }

            if (error.code === 'ECONNABORTED') {
                return res.status(504).json({
                    success: false,
                    message: 'Model service timed out',
                });
            }

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    message: 'Model service is unavailable',
                });
            }

            console.error('Error occurred while processing the request:', error);
            res.status(500).json({ success: false, message: 'Server error during diagnosis' });
        }
    };

    if (requireAuthForRequest) {
        return requireAuth(req, res, runDiagnosis);
    }

    return runDiagnosis();
});

module.exports = router;