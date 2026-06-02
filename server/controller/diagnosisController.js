const Diagnosis= require('../models/Diagnosis');

const getAuthenticatedUserId = (req) => req.user?.userId || req.user?._id;

const saveDiagnosis = async (req,res) =>{
    try{
        const {imageurl,diseaseName,confidence} = req.body;
        const userId = getAuthenticatedUserId(req);

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const newDiagnosis = new Diagnosis({
            user: userId,
            imageUrl: imageurl,
            diseaseName,
            confidence,
        });
        const savedDiagnosis = await newDiagnosis.save();
        res.status(201).json(savedDiagnosis);
    } catch (error) {
        console.error("Error saving diagnosis:", error);
        res.status(500).json({ message: error.message });
    }
};

const getUserHistory = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const history = await Diagnosis.find({ user: userId }).sort({ createdAt: -1 });
        res.status(200).json(history);
    } catch (error) {
        console.error("Error fetching user history:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports={
    saveDiagnosis,
    getUserHistory
};