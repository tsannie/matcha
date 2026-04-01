import pool from '../config/db.js';
import { updateFameRating } from '../utils/fameRating.js';
import { emitToUser } from '../socket.js';
import {
  USER_CARD_BASE_COLUMNS,
  USER_CARD_JOINS,
  MUTUAL_LIKE_SQL,
  buildBlockCondition,
  getUsersWithDistances,
} from '../utils/queryHelpers.js';
import { createNotification } from '../utils/notifications.js';

export const likeUser = async (req, res) => {
  const userId = req.user.id;
  const targetUserId = parseInt(req.params.userId);

  if (isNaN(targetUserId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (userId === targetUserId) {
    return res.status(400).json({ error: 'Cannot like yourself' });
  }

  try {
    const targetUser = await pool.query('SELECT id, username, profile_complete FROM users WHERE id = $1', [
      targetUserId,
    ]);

    if (targetUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!targetUser.rows[0].profile_complete) {
      return res.status(400).json({ error: 'User profile is not complete' });
    }

    await pool.query('INSERT INTO likes (liker_id, liked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
      userId,
      targetUserId,
    ]);

    const mutualLike = await pool.query('SELECT id FROM likes WHERE liker_id = $1 AND liked_id = $2', [
      targetUserId,
      userId,
    ]);

    const isMatch = mutualLike.rows.length > 0;

    const currentUser = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);

    const notificationType = isMatch ? 'match' : 'like';
    const notificationMessage = isMatch
      ? `You matched with ${currentUser.rows[0].username}!`
      : `${currentUser.rows[0].username} liked your profile`;

    await createNotification(pool, {
      userId: targetUserId,
      type: notificationType,
      fromUserId: userId,
      fromUsername: currentUser.rows[0].username,
      message: notificationMessage,
    });

    if (isMatch) {
      await createNotification(pool, {
        userId,
        type: 'match',
        fromUserId: targetUserId,
        fromUsername: targetUser.rows[0].username,
        message: `You matched with ${targetUser.rows[0].username}!`,
      });
    }

    await updateFameRating(targetUserId);

    res.json({
      success: true,
      isMatch,
      message: isMatch ? "It's a match!" : 'User liked successfully',
    });
  } catch (err) {
    console.error('Error liking user:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const unlikeUser = async (req, res) => {
  const userId = req.user.id;
  const targetUserId = parseInt(req.params.userId);

  if (isNaN(targetUserId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const wasConnected = await pool.query(
      `SELECT 1 FROM likes l1
       WHERE l1.liker_id = $1 AND l1.liked_id = $2
       AND EXISTS (SELECT 1 FROM likes l2 WHERE l2.liker_id = $2 AND l2.liked_id = $1)`,
      [userId, targetUserId],
    );

    const result = await pool.query('DELETE FROM likes WHERE liker_id = $1 AND liked_id = $2 RETURNING id', [
      userId,
      targetUserId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Like not found' });
    }

    if (wasConnected.rows.length > 0) {
      const currentUser = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);

      await pool.query(
        'DELETE FROM messages WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)',
        [userId, targetUserId],
      );

      emitToUser(userId, 'chat-deleted', { userId: targetUserId });
      emitToUser(targetUserId, 'chat-deleted', { userId });

      await createNotification(pool, {
        userId: targetUserId,
        type: 'unlike',
        fromUserId: userId,
        fromUsername: currentUser.rows[0].username,
        message: `${currentUser.rows[0].username} unliked you`,
      });
    }

    await updateFameRating(targetUserId);

    res.json({ success: true, message: 'User unliked successfully' });
  } catch (err) {
    console.error('Error unliking user:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getLikesReceived = async (req, res) => {
  const userId = req.user.id;

  try {
    const users = await getUsersWithDistances(
      userId,
      `SELECT
        ${USER_CARD_BASE_COLUMNS},
        l.created_at as liked_at,
        EXISTS(SELECT 1 FROM likes WHERE liker_id = $1 AND liked_id = u.id) as liked_by_me,
        ${MUTUAL_LIKE_SQL}
      FROM likes l
      JOIN users u ON l.liker_id = u.id
      ${USER_CARD_JOINS}
      WHERE l.liked_id = $1
      AND ${buildBlockCondition()}
      AND NOT EXISTS(SELECT 1 FROM likes WHERE liker_id = $1 AND liked_id = u.id)
      GROUP BY u.id, l.created_at
      ORDER BY l.created_at DESC`,
      [userId],
    );

    if (!users) return res.status(404).json({ error: 'User not found' });
    res.json(users);
  } catch (err) {
    console.error('Error getting likes received:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getLikesSent = async (req, res) => {
  const userId = req.user.id;

  try {
    const users = await getUsersWithDistances(
      userId,
      `SELECT
        ${USER_CARD_BASE_COLUMNS},
        l.created_at as liked_at,
        true as liked_by_me,
        EXISTS(SELECT 1 FROM likes WHERE liker_id = u.id AND liked_id = $1) as liked_by_them,
        ${MUTUAL_LIKE_SQL}
      FROM likes l
      JOIN users u ON l.liked_id = u.id
      ${USER_CARD_JOINS}
      WHERE l.liker_id = $1
      AND ${buildBlockCondition()}
      AND NOT EXISTS(SELECT 1 FROM likes WHERE liker_id = u.id AND liked_id = $1)
      GROUP BY u.id, l.created_at
      ORDER BY l.created_at DESC`,
      [userId],
    );

    if (!users) return res.status(404).json({ error: 'User not found' });
    res.json(users);
  } catch (err) {
    console.error('Error getting likes sent:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getMatches = async (req, res) => {
  const userId = req.user.id;

  try {
    const users = await getUsersWithDistances(
      userId,
      `SELECT
        ${USER_CARD_BASE_COLUMNS},
        u.is_online,
        u.last_seen,
        GREATEST(l1.created_at, l2.created_at) as matched_at,
        true as liked_by_me,
        true as is_match
      FROM likes l1
      JOIN likes l2 ON l1.liker_id = l2.liked_id AND l1.liked_id = l2.liker_id
      JOIN users u ON u.id = l1.liked_id
      ${USER_CARD_JOINS}
      WHERE l1.liker_id = $1
      AND ${buildBlockCondition()}
      GROUP BY u.id, l1.created_at, l2.created_at
      ORDER BY matched_at DESC`,
      [userId],
    );

    if (!users) return res.status(404).json({ error: 'User not found' });
    res.json(users);
  } catch (err) {
    console.error('Error getting matches:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const checkLikeStatus = async (req, res) => {
  const userId = req.user.id;
  const targetUserId = parseInt(req.params.userId);

  if (isNaN(targetUserId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const result = await pool.query(
      `SELECT
        EXISTS(SELECT 1 FROM likes WHERE liker_id = $1 AND liked_id = $2) as liked_by_me,
        EXISTS(SELECT 1 FROM likes WHERE liker_id = $2 AND liked_id = $1) as liked_by_them,
        EXISTS(
          SELECT 1 FROM likes l1
          WHERE l1.liker_id = $1 AND l1.liked_id = $2
          AND EXISTS(SELECT 1 FROM likes l2 WHERE l2.liker_id = $2 AND l2.liked_id = $1)
        ) as is_match`,
      [userId, targetUserId],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error checking like status:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
