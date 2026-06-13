const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const upload = require('../utils/uploadConfig');


router.post('/diagnose',requireAuth,upload.single('leafImage'),async(req,res)=>{
    try{
        const imagePath= req.file.path;
        // call fastapi for prediction

        res.status(200).json({ 
            success: true,
            disease:"example disease",
            confidence:"98%"
         });
    } catch (error) {
        console.error('Error occurred while processing the request:', error);
        res.status(500).json({ error: "server error during diagnosis" });
    }
});

module.exports =router;