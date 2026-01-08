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

    // Chat message event
    socket.on('send-message', async (data) => {
      const { receiverId, content } = data;

      try {
        // Validate input
        if (!receiverId || !content || typeof content !== 'string') {
          socket.emit('message-error', { error: 'Invalid message data' });
          return;
        }

        const trimmed = content.trim();
        if (trimmed.length === 0 || trimmed.length > 2000) {
          socket.emit('message-error', { error: 'Invalid message length' });
          return;
        }

        // Validate match
        const match = await pool.query(
          `SELECT 1 FROM likes l1
           WHERE l1.liker_id = $1 AND l1.liked_id = $2
           AND EXISTS(SELECT 1 FROM likes l2 WHERE l2.liker_id = $2 AND l2.liked_id = $1)`,
          [socket.userId, receiverId]
        );

        if (match.rows.length === 0) {
          socket.emit('message-error', { error: 'Not matched with this user' });
          return;
        }

        // Check blocks
        const blocked = await pool.query(
          `SELECT 1 FROM blocks
           WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
          [socket.userId, receiverId]
        );

        if (blocked.rows.length > 0) {
          socket.emit('message-error', { error: 'Cannot message blocked users' });
          return;
        }

        // Insert message
        const result = await pool.query(
          'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
          [socket.userId, receiverId, trimmed]
        );

        const message = result.rows[0];

        // Emit to receiver
        io.to(`user:${receiverId}`).emit('receive-message', {
          id: message.id,
          senderId: socket.userId,
          senderUsername: socket.username,
          receiverId: message.receiver_id,
          content: message.content,
          createdAt: message.created_at,
          isRead: false
        });

        // Confirm to sender
        socket.emit('message-sent', {
          id: message.id,
          receiverId,
          content: message.content,
          createdAt: message.created_at
        });

        // Create and emit notification
        await pool.query(
          'INSERT INTO notifications (user_id, type, from_user_id, message) VALUES ($1, $2, $3, $4)',
          [receiverId, 'message', socket.userId, `New message from ${socket.username}`]
        );

        emitNotification(receiverId, {
          id: Date.now(),
          type: 'message',
          from_user_id: socket.userId,
          from_username: socket.username,
          message: `New message from ${socket.username}`,
          created_at: new Date(),
          is_read: false
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing-start', ({ receiverId }) => {
      io.to(`user:${receiverId}`).emit('user-typing', {
        userId: socket.userId,
        username: socket.username
      });
    });

    socket.on('typing-stop', ({ receiverId }) => {
      io.to(`user:${receiverId}`).emit('user-stopped-typing', {
        userId: socket.userId
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
