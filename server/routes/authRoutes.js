const express = require('express');
const {
  signup,
  verifyEmail,
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
} = require('../controller/authController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.get('/verify/:token', verifyEmail);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/profile', requireAuth, updateProfile);
router.put('/change-password', requireAuth, changePassword);

module.exports = router;
