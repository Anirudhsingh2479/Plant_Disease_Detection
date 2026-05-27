const express = require('express');
const { signup, verifyEmail, login, logout } = require('../controller/authController');
const User = require('../models/User');

const router = express.Router();

router.post('/signup', signup);
router.get('/verify/:token', verifyEmail);
router.post('/login', login);
router.post('/logout', logout);
router.delete('/delete-all', async (req, res) => {
    try {
        await User.deleteMany({});
        res.status(200).json({ message: 'All users deleted successfully' });
    }
        catch (error) {
        res.status(500).json({ message: 'Error deleting users', error: error.message });
    }
});

module.exports = router;