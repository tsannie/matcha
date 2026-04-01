import pool from '../config/db.js';
import { getIO } from '../socket.js';

export const blockUser = async (req, res) => {
  const blockerId = req.user.id;
  const blockedId = parseInt(req.params.userId);

  if (isNaN(blockedId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (blockerId === blockedId) {
    return res.status(400).json({ error: 'Cannot block yourself' });
  }

  try {
    const blockedUser = await pool.query('SELECT id FROM users WHERE id = $1', [blockedId]);

    if (blockedUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.query('INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
      blockerId,
      blockedId,
    ]);

    await pool.query('DELETE FROM likes WHERE (liker_id = $1 AND liked_id = $2) OR (liker_id = $2 AND liked_id = $1)', [
      blockerId,
      blockedId,
    ]);

    try {
      const io = getIO();
      io.to(`user:${blockedId}`).emit('conversation_unavailable', { userId: blockerId });
    } catch (_) {}

    res.json({ success: true, message: 'User blocked successfully' });
  } catch (err) {
    console.error('Error blocking user:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const unblockUser = async (req, res) => {
  const blockerId = req.user.id;
  const blockedId = parseInt(req.params.userId);

  if (isNaN(blockedId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const result = await pool.query('DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2 RETURNING id', [
      blockerId,
      blockedId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Block not found' });
    }

    res.json({ success: true, message: 'User unblocked successfully' });
  } catch (err) {
    console.error('Error unblocking user:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getBlockedUsers = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT
        u.id,
        u.username,
        u.firstname,
        u.lastname,
        u.birthdate,
        EXTRACT(YEAR FROM AGE(u.birthdate)) as age,
        COALESCE(
          (SELECT file_path FROM user_images WHERE user_id = u.id AND is_profile_picture = true LIMIT 1),
          (SELECT file_path FROM user_images WHERE user_id = u.id LIMIT 1)
        ) as profile_picture,
        b.created_at as blocked_at
      FROM blocks b
      JOIN users u ON b.blocked_id = u.id
      WHERE b.blocker_id = $1
      ORDER BY b.created_at DESC`,
      [userId],
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error getting blocked users:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
