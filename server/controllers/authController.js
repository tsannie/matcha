import pool from '../config/db.js';
import { hashPassword, validateRegistration, validateResetPassword } from '../utils/validation.js';
import { sendResetPasswordEmail, sendVerificationEmail } from '../utils/emailService.js';

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export const register = async (req, res) => {
  const { email, username, password, firstname, lastname, birthdate } = req.body;

  const error = validateRegistration(email, username, password, firstname, lastname, birthdate);
  if (error) return res.status(400).json({ error });

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);

    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email or Username already exists.' });
    }

    const hashedPassword = await hashPassword(password);

    const verifyToken = crypto.randomBytes(32).toString('hex');

    const newUser = await pool.query(
      `INSERT INTO users (email, username, firstname, lastname, birthdate, password, token)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, email`,
      [email, username, firstname, lastname, birthdate, hashedPassword, verifyToken]
    );

    await sendVerificationEmail(email, verifyToken);

    res.status(201).json({
      message: 'User created successfully. Please check your email to verify your account.',
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req, res) => {
  const { username, password, rememberMe } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in.' });
    }

    const expiresIn = rememberMe ? '30d' : '1h';
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn });

    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(400).json({ error: 'Token is missing' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE token = $1', [token]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token.' });
    }

    await pool.query('UPDATE users SET verified = true, token = NULL WHERE id = $1', [result.rows[0].id]);

    res.status(200).json({ message: 'Account verified successfully! You can now log in.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length === 0) {
      return res.status(200).json({ message: 'If an account exists with this email, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await pool.query('UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3', [
      token,
      expires,
      email,
    ]);

    await sendResetPasswordEmail(email, token);

    res.status(200).json({ message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  const error = validateResetPassword(newPassword);
  if (error) return res.status(400).json({ error });

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE reset_password_token = $1', [token]);

    if (userCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token.' });
    }

    const user = userCheck.rows[0];
    const now = new Date();

    if (parseInt(user.reset_password_expires) < now) {
      return res.status(400).json({ error: 'Token has expired. Please request a new one.' });
    }

    const hashedPassword = await hashPassword(newPassword);

    await pool.query(
      'UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res
      .status(200)
      .json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
