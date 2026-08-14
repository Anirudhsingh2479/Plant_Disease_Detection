const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../utils/sendEmail');

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

const getAccessTokenSecret = () => (
  process.env.ACCESS_TOKEN_SECRET || process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'default_access_secret'
);

const getRefreshTokenSecret = () => (
  process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET ? `${process.env.JWT_SECRET}_refresh` : 'default_refresh_secret')
);

const generateAccessToken = (user) => {
  return jwt.sign({ userId: user._id }, getAccessTokenSecret(), { expiresIn: '15m' });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ userId: user._id }, getRefreshTokenSecret(), { expiresIn: '7d' });
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };

  if (accessToken) {
    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
  }

  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
};

const clearAuthCookies = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };

  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  res.clearCookie('token', cookieOptions);
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const userObject = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete userObject.password;
  delete userObject.refreshToken;
  return userObject;
};

const publicAuthPayload = (user, accessToken, refreshToken) => ({
  accessToken,
  refreshToken,
  user: sanitizeUser(user),
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
      getAccessTokenSecret(),
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
    const decoded = jwt.verify(decodedToken, getAccessTokenSecret());

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(400).json({ message: 'Invalid token or user does not exist' });

    const wasVerified = user.isVerified;
    if (!user.isVerified) {
      user.isVerified = true;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      accessToken,
      refreshToken,
      result: publicAuthPayload(user, accessToken, refreshToken),
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

    const cleanEmail = normalizeEmail(email);
    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      user = await User.findOne({
        email: new RegExp(`^${cleanEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i'),
      });
    }

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

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      accessToken,
      refreshToken,
      result: publicAuthPayload(user, accessToken, refreshToken),
      message: 'Logged in successfully',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

const refresh = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      clearAuthCookies(res);
      return res.status(401).json({ success: false, message: 'Refresh token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(incomingRefreshToken, getRefreshTokenSecret());
    } catch {
      clearAuthCookies(res);
      return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== incomingRefreshToken) {
      clearAuthCookies(res);
      return res.status(403).json({ success: false, message: 'Refresh token has been revoked or is invalid' });
    }

    // Token Rotation: Generate new Access Token AND new Refresh Token
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    setAuthCookies(res, newAccessToken, newRefreshToken);

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    clearAuthCookies(res);
    return res.status(500).json({ success: false, message: 'Server error during token refresh', error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const userId = req.user?.userId || req.user?._id;

    if (userId) {
      await User.findByIdAndUpdate(userId, { refreshToken: null });
    } else if (incomingRefreshToken) {
      await User.findOneAndUpdate({ refreshToken: incomingRefreshToken }, { refreshToken: null });
    }

    clearAuthCookies(res);
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    clearAuthCookies(res);
    return res.status(500).json({ success: false, message: 'Error during logout', error: error.message });
  }
};

const me = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const user = await User.findById(userId).select('-password -refreshToken');

    if (!user) {
      return res.status(401).json({ message: 'User session is no longer valid' });
    }

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load current user', error: error.message });
  }
};

module.exports = { signup, verifyEmail, login, refresh, logout, me };
