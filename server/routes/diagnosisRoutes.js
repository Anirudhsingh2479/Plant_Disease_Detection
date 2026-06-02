const express = require("express");
const { saveDiagnosis, getUserHistory } = require("../controller/diagnosisController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get('/history', requireAuth, getUserHistory);
router.post('/analyze', requireAuth, saveDiagnosis);

module.exports = router;