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
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email service not configured. Missing EMAIL_USER or EMAIL_PASS in environment variables.');
  }

  const encodedToken = encodeURIComponent(token);
  const verificationLink = `${getClientBaseUrl()}/verify-email?token=${encodedToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Verify Your Email - Plant Disease Detection',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #2e7d32;">Welcome to PlantCare AI!</h2>
        <p>Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
        <p style="color: #64748b; font-size: 0.9em;">This link will expire in 1 hour.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending verification email to', userEmail, ':', error.message);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

const sendPasswordResetEmail = async (userEmail, token) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email service not configured. Missing EMAIL_USER or EMAIL_PASS in environment variables.');
  }

  const encodedToken = encodeURIComponent(token);
  const resetLink = `${getClientBaseUrl()}/reset-password?token=${encodedToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Reset Your Password - PlantCare AI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #2e7d32;">Password Reset Request</h2>
        <p>You requested to reset your password for your PlantCare AI account.</p>
        <p>Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 0.9em;">If you did not request this, please ignore this email. This link will expire in 1 hour.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending password reset email to', userEmail, ':', error.message);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
