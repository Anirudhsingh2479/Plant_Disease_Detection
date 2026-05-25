// const express= require("express");
// const { saveDiagnosis, getUserHistory } = require("../controller/diagnosisController");
// const router = express.Router();
// const requireAuth = require("../middleware/authMiddleware");

// router.get('/history', requireAuth, getUserHistory);
// router.post('/analyze', requireAuth, saveDiagnosis);

// module.exports=router;


const express = require("express");
const { saveDiagnosis, getUserHistory } = require("../controller/diagnosisController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// --- DEBUG CHECK ---
// This will print to your terminal right before the crash happens
console.log("1. Is saveDiagnosis a function?", typeof saveDiagnosis);
console.log("2. Is getUserHistory a function?", typeof getUserHistory);
console.log("3. Is requireAuth a function?", typeof requireAuth);
// -------------------

router.get('/history', requireAuth, getUserHistory);
router.post('/analyze', requireAuth, saveDiagnosis);

module.exports = router;