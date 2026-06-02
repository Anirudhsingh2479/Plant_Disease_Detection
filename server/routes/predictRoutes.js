const express = require('express');
const router = express.Router();
const fs = require('node:fs');
const axios = require('axios');
const FormData = require('form-data');
const { requireAuth } = require('../middleware/authMiddleware');
const upload = require('../utils/uploadConfig');
const Diagnosis = require('../models/Diagnosis');

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';
const FASTAPI_TIMEOUT_MS = Number(process.env.FASTAPI_TIMEOUT_MS || 15000);
const getAuthenticatedUserId = (req) => req.user?.userId || req.user?._id;

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

router.post('/diagnose',requireAuth,upload.single('leafImage'),async(req,res)=>{
    try{
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'leafImage is required' });
        }

        const form = new FormData();
        form.append('file', fs.createReadStream(req.file.path), {
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
        const imageUrl = `/uploads/${req.file.filename}`;

        const savedDiagnosis = await Diagnosis.create({
            user: userId,
            imageUrl,
            diseaseName: normalizedPrediction.diseaseName,
            confidence: normalizedPrediction.confidence,
        });

        res.status(200).json({ 
            success: true,
            message: 'Diagnosis completed successfully',
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
});

module.exports = router;