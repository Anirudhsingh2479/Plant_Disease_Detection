const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  requireTLS: true,
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
});

const getClientBaseUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

const sendVerificationEmail = async (userEmail, token) => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email service not configured. Missing EMAIL_USER or EMAIL_PASS in environment variables.');
  }

  // URL encode the token to preserve special characters
  const encodedToken = encodeURIComponent(token);
  const verificationLink = `${getClientBaseUrl()}/verify-email?token=${encodedToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Verify Your Email - Plant Disease Detection',
    html: `
      <h2>Welcome!</h2>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationLink}">Verify Email</a>
      <p>This link will expire in 1 hour.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email to', userEmail, ':', error.message);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

module.exports = { sendVerificationEmail };
