const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../utils/sendEmail');

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

const sanitizeUser = (user) => {
  const userObject = user.toObject();
  delete userObject.password;
  return userObject;
};

const buildAuthResponse = (user) => {
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  return {
    token,
    user: sanitizeUser(user),
  };
};

const setAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

const publicAuthPayload = (authPayload) => ({
  user: authPayload.user,
});

const getClientBaseUrl = () => process.env.CLIENT_URL || 'http://localhost:5174';

const buildVerificationLink = (token) => (
  `${getClientBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`
);

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const validateSignupInput = ({ name, email, password }) => {
  if (!name?.trim() || !email?.trim() || !password) {
    return 'Name, email, and password are required';
  }

  if (!EMAIL_PATTERN.test(email)) {
    return 'Please enter a valid email address';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  return null;
};

const validateLoginInput = ({ email, password }) => {
  if (!email?.trim() || !password) {
    return 'Email and password are required';
  }

  if (!EMAIL_PATTERN.test(email)) {
    return 'Please enter a valid email address';
  }

  return null;
};

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const validationError = validateSignupInput({ name, email, password });
    if (validationError) return res.status(400).json({ message: validationError });

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    await newUser.save();

    const verificationToken = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    try {
      await sendVerificationEmail(newUser.email, verificationToken);
      return res.status(201).json({
        message: 'Signup successful! Please check your email to verify your account.',
      });
    } catch (emailError) {
      if (process.env.NODE_ENV !== 'production') {
        return res.status(201).json({
          message: 'Signup successful, but email could not be sent. Use the development verification link.',
          devVerificationLink: buildVerificationLink(verificationToken),
          emailError: emailError.message,
        });
      }

      await User.findByIdAndDelete(newUser._id);
      return res.status(500).json({ message: `Signup failed: ${emailError.message}` });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decodedToken = decodeURIComponent(token);
    const decoded = jwt.verify(decodedToken, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(400).json({ message: 'Invalid token or user does not exist' });

    const wasVerified = user.isVerified;
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    const authPayload = buildAuthResponse(user);
    setAuthCookie(res, authPayload.token);

    return res.status(200).json({
      result: publicAuthPayload(authPayload),
      message: wasVerified ? 'Email is already verified' : 'Email verified successfully',
    });
  } catch {
    return res.status(400).json({ message: 'Token is invalid or has expired.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const validationError = validateLoginInput({ email, password });
    if (validationError) return res.status(400).json({ message: validationError });

    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const authPayload = buildAuthResponse(user);
    setAuthCookie(res, authPayload.token);

    return res.status(200).json({
      result: publicAuthPayload(authPayload),
      message: 'Logged in successfully',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  return res.status(200).json({ message: 'Logged out successfully' });
};

const me = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User session is no longer valid' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load current user', error: error.message });
  }
};

module.exports = { signup, verifyEmail, login, logout, me };
