const Diagnosis= require('../models/Diagnosis');

const saveDiagnosis = async (req,res) =>{
    try{
        const {imageurl,diseaseName,confidence} = req.body;

        const newDiagnosis = new Diagnosis({
            user: req.user._id,
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
        const history = await Diagnosis.find({ user: req.user._id }).sort({ createdAt: -1 });
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