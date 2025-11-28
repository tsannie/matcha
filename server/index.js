import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runDatabaseMigration } from './utils/dbInit.js';

import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

app.listen(port, async () => {
  await runDatabaseMigration();

  console.log(`🚀 Server running on port ${port}`);
});
