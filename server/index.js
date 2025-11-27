import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import { runDatabaseMigration } from './utils/dbInit.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.listen(port, async () => {
  await runDatabaseMigration();

  console.log(`🚀 Server running on port ${port}`);
});
