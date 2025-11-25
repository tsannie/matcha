import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js'; // Import our clean DB connection
import { validateRegistration } from '../utils/validation.js';

export const register = async (req, res) => {
  const { email, username, password, firstname, lastname } = req.body;

  const error = validateRegistration(email, username, password, firstname, lastname);
  if (error) return res.status(400).json({ error });

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);

    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email or Username already exists.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const verifyToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

    const newUser = await pool.query(
      `INSERT INTO users (email, username, firstname, lastname, password, token)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email`,
      [email, username, firstname, lastname, hashedPassword, verifyToken]
    );

    res.status(201).json({
      message: 'User created successfully. Please verify your email.',
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

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

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
