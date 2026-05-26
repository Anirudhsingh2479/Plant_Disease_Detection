const express = require('express');
const { signup, verifyEmail, login, logout } = require('../controller/authController');

const router = express.Router();

router.post('/signup', signup);
router.get('/verify/:token', verifyEmail);
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;