const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (userEmail, token) => {
  const verificationLink = `http://localhost:${process.env.PORT || 5000}/api/auth/verify/${token}`;

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
    console.log('Verification email sent to:', userEmail);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { sendVerificationEmail };