import pool from '../config/db.js';

// Validate users have mutual likes (are matched)
export const validateMatch = async (req, res, next) => {
  const userId = req.user.id;
  const targetUserId = parseInt(req.params.userId);

  if (isNaN(targetUserId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (userId === targetUserId) {
    return res.status(400).json({ error: 'Cannot chat with yourself' });
  }

  try {
    // Check for mutual likes (match)
    const match = await pool.query(
      `SELECT 1 FROM likes l1
       WHERE l1.liker_id = $1 AND l1.liked_id = $2
       AND EXISTS(SELECT 1 FROM likes l2 WHERE l2.liker_id = $2 AND l2.liked_id = $1)`,
      [userId, targetUserId]
    );

    if (match.rows.length === 0) {
      return res.status(403).json({ error: 'You can only chat with matched users' });
    }

    // Check for blocks
    const blocked = await pool.query(
      `SELECT 1 FROM blocks
       WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
      [userId, targetUserId]
    );

    if (blocked.rows.length > 0) {
      return res.status(403).json({ error: 'Cannot chat with blocked users' });
    }

    next();
  } catch (error) {
    console.error('Match validation error:', error);
    res.status(500).json({ error: 'Server error validating match' });
  }
};

// Validate message content
export const validateMessage = (req, res, next) => {
  const { content } = req.body;

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  if (trimmed.length > 2000) {
    return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
  }

  req.body.content = trimmed;
  next();
};
