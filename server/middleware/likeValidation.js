import pool from '../config/db.js';

/**
 * Middleware to validate if user can like others
 * Checks:
 * 1. User has at least one profile picture
 * 2. User's profile is complete
 */
export const validateCanLike = async (req, res, next) => {
  const userId = req.user.id;

  try {
    // Check if user has at least one picture
    const profilePicResult = await pool.query(
      'SELECT id FROM user_images WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (profilePicResult.rows.length === 0) {
      return res.status(403).json({
        error: 'You must have a profile picture to like others'
      });
    }

    // Check if profile is complete
    const userResult = await pool.query(
      'SELECT profile_complete FROM users WHERE id = $1',
      [userId]
    );

    if (!userResult.rows[0]?.profile_complete) {
      return res.status(403).json({
        error: 'Complete your profile first'
      });
    }

    next();
  } catch (err) {
    console.error('Error validating like permission:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Middleware to validate if users are not blocked
 * Checks if either user has blocked the other
 */
export const validateNotBlocked = async (req, res, next) => {
  const userId = req.user.id;
  const targetId = parseInt(req.params.userId);

  if (isNaN(targetId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    // Check if either user blocked the other
    const blockResult = await pool.query(
      `SELECT id FROM blocks
       WHERE (blocker_id = $1 AND blocked_id = $2)
          OR (blocker_id = $2 AND blocked_id = $1)`,
      [userId, targetId]
    );

    if (blockResult.rows.length > 0) {
      return res.status(403).json({ error: 'Cannot interact with this user' });
    }

    next();
  } catch (err) {
    console.error('Error checking block status:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
