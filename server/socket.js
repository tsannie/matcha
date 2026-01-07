import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import pool from './config/db.js';

let io;

/**
 * Update user online status in database
 */
const updateUserStatus = async (userId, isOnline) => {
  try {
    await pool.query(
      'UPDATE users SET is_online = $1, last_seen = CURRENT_TIMESTAMP WHERE id = $2',
      [isOnline, userId]
    );
  } catch (err) {
    console.error('Error updating user status:', err);
  }
};

/**
 * Initialize Socket.io server
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error'));
      }

      socket.userId = decoded.id;
      socket.username = decoded.username;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`✅ User ${socket.userId} (${socket.username}) connected`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Update user status to online
    updateUserStatus(socket.userId, true);

    // Broadcast online status to all connected users
    socket.broadcast.emit('user-status', {
      userId: socket.userId,
      isOnline: true
    });

    socket.on('disconnect', () => {
      console.log(`❌ User ${socket.userId} (${socket.username}) disconnected`);

      // Update user status to offline
      updateUserStatus(socket.userId, false);

      // Broadcast offline status
      socket.broadcast.emit('user-status', {
        userId: socket.userId,
        isOnline: false
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  console.log('🔌 Socket.io initialized');
  return io;
};

/**
 * Get Socket.io instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/**
 * Emit notification to specific user
 */
export const emitNotification = (userId, notification) => {
  if (!io) {
    console.warn('Socket.io not initialized, cannot emit notification');
    return;
  }

  io.to(`user:${userId}`).emit('notification', notification);
  console.log(`📬 Notification sent to user ${userId}:`, notification.type);
};

/**
 * Emit event to specific user
 */
export const emitToUser = (userId, event, data) => {
  if (!io) {
    console.warn('Socket.io not initialized, cannot emit event');
    return;
  }

  io.to(`user:${userId}`).emit(event, data);
};
