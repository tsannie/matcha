import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('Log used:', process.env.EMAIL_USER);
console.log('Host used:', process.env.EMAIL_HOST);
console.log('Port used:', process.env.EMAIL_PORT);
console.log('Secure used:', process.env.EMAIL_PASS);
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: '"Matcha Team" <no-reply@matcha.com>',
    to: email,
    subject: 'Verify your Matcha account',
    html: `
      <h1>Welcome to Matcha!</h1>
      <p>Please click the link below to verify your account:</p>
      <a href="${url}">Verify Account</a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Email sending failed'); // Let the controller handle the error
  }
};
