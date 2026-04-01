import pool from '../config/db.js';
import { emitNotification } from '../socket.js';

export const createNotification = async (db, { userId, type, fromUserId, fromUsername, message }) => {
  await db.query(
    'INSERT INTO notifications (user_id, type, from_user_id, message) VALUES ($1, $2, $3, $4)',
    [userId, type, fromUserId, message],
  );
  emitNotification(userId, {
    id: Date.now(),
    type,
    from_user_id: fromUserId,
    from_username: fromUsername,
    message,
    created_at: new Date(),
    is_read: false,
  });
};
