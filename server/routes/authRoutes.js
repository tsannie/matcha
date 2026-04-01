import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, verifyEmail, forgotPassword, resetPassword } from '../controllers/authController.js';

const router = express.Router();

const isDev = process.env.NODE_ENV !== 'production';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

router.post('/register', emailLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-email', emailLimiter, verifyEmail);
router.post('/forgot-password', emailLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

export default router;
