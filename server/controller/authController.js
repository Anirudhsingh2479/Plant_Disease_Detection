const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../utils/sendEmail');

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    // user already exists
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);// generate a random string of length 10 to have different hash for same password 
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: hashedPassword }); //This only creates object in memory.

    await newUser.save(); // This saves the user to the database but no Update on verification status..

    const verificationToken = jwt.sign(
      { userId: newUser._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    await sendVerificationEmail(newUser.email, verificationToken);

    res.status(201).json({ message: 'Signup successful! Please check your email to verify your account.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params; //Extracts token from URL parameter.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(400).json({ message: 'Invalid token or user does not exist' });
    if (user.isVerified) return res.status(400).json({ message: 'User is already verified' });

    user.isVerified = true; //Updates verification status.
    await user.save();//saves the updated user to the database.

    // Redirect to your React login page
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?verified=true`);
  } catch (error) {
    res.status(400).json({ message: 'Token is invalid or has expired.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email before logging in.' });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);// here Compares entered password with hashed password.
    //You NEVER decrypt password.Instead bcrypt hashes entered password again and compares hashes.

    if (!isPasswordCorrect) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Using your secure cookie-parser setup!
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    //Stores JWT inside browser cookie.

    res.status(200).json({ result: user, message: 'Logged in successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

module.exports = { signup, verifyEmail, login };