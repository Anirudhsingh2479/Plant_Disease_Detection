const mongoose = require("mongoose");

const diagnosisSchema =new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    imageUrl:{
        type:String,
        required:true,
    },
    cloudinaryUrl:{
        type:String,
        required:true,
    },
    diseaseName:{
        type:String,
        required:true,
    },
    confidence:{
        type:Number,
        required:true,  
    },
    createdAt:{
        type:Date,
        default:Date.now,
    },
});

module.exports = mongoose.model('Diagnosis', diagnosisSchema);