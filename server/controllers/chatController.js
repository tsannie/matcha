import pool from '../config/db.js';
import { createNotification } from '../utils/notifications.js';

export const getConversations = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT DISTINCT
        u.id as user_id,
        u.username,
        u.firstname,
        u.is_online,
        u.last_seen,
        (SELECT file_path FROM user_images WHERE user_id = u.id AND is_profile_picture = true LIMIT 1) as profile_picture,
        (SELECT content FROM messages
         WHERE (sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1)
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages
         WHERE (sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1)
         ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages
         WHERE sender_id = u.id AND receiver_id = $1 AND is_read = false) as unread_count
      FROM users u
      WHERE EXISTS (
        SELECT 1 FROM likes l1
        WHERE l1.liker_id = $1 AND l1.liked_id = u.id
        AND EXISTS(SELECT 1 FROM likes l2 WHERE l2.liker_id = u.id AND l2.liked_id = $1)
      )
      AND NOT EXISTS (
        SELECT 1 FROM blocks
        WHERE (blocker_id = $1 AND blocked_id = u.id) OR (blocker_id = u.id AND blocked_id = $1)
      )
      ORDER BY last_message_time DESC NULLS LAST`,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Server error fetching conversations' });
  }
};

export const getMessages = async (req, res) => {
  const userId = req.user.id;
  const targetUserId = parseInt(req.params.userId);
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const result = await pool.query(
      `SELECT id, sender_id, receiver_id, content, is_read, created_at
       FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC
       LIMIT $3 OFFSET $4`,
      [userId, targetUserId, limit, offset],
    );

    await pool.query(
      `UPDATE messages
       SET is_read = true
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
      [targetUserId, userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error fetching messages' });
  }
};

export const sendMessage = async (req, res) => {
  const userId = req.user.id;
  const targetUserId = parseInt(req.params.userId);
  const { content } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
      [userId, targetUserId, content],
    );

    const message = result.rows[0];

    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    const username = userResult.rows[0].username;

    await createNotification(pool, {
      userId: targetUserId,
      type: 'message',
      fromUserId: userId,
      fromUsername: username,
      message: `New message from ${username}`,
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Server error sending message' });
  }
};

export const markMessagesAsRead = async (req, res) => {
  const userId = req.user.id;
  const senderId = parseInt(req.params.userId);

  try {
    const result = await pool.query(
      `UPDATE messages
       SET is_read = true
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false
       RETURNING id`,
      [senderId, userId],
    );

    res.json({ count: result.rowCount });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
