import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { runDatabaseMigration } from './utils/dbInit.js';
import { initializeSocket } from './socket.js';

import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import browsingRoutes from './routes/browsingRoutes.js';
import likeRoutes from './routes/likeRoutes.js';
import viewRoutes from './routes/viewRoutes.js';
import blockRoutes from './routes/blockRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/browsing', browsingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/views', viewRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create HTTP server and initialize Socket.io
const server = createServer(app);
initializeSocket(server);

server.listen(port, async () => {
  await runDatabaseMigration();

  console.log(`🚀 Server running on port ${port}`);
});
