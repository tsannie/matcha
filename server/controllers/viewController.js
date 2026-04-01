import pool from '../config/db.js';
import { updateFameRating } from '../utils/fameRating.js';
import { USER_CARD_BASE_COLUMNS, USER_CARD_JOINS, MUTUAL_LIKE_SQL, buildBlockCondition, getUsersWithDistances } from '../utils/queryHelpers.js';
import { createNotification } from '../utils/notifications.js';

export const recordProfileView = async (req, res) => {
  const viewerId = req.user.id;
  const viewedId = parseInt(req.params.userId);

  if (isNaN(viewedId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (viewerId === viewedId) {
    return res.status(400).json({ error: 'Cannot view your own profile' });
  }

  try {
    const viewedUser = await pool.query('SELECT id, username FROM users WHERE id = $1', [viewedId]);

    if (viewedUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const viewResult = await pool.query(
      `INSERT INTO profile_views (viewer_id, viewed_id, viewed_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (viewer_id, viewed_id)
       DO UPDATE SET viewed_at = CURRENT_TIMESTAMP
       RETURNING (xmax = 0) AS is_new_view`,
      [viewerId, viewedId],
    );

    const isNewView = viewResult.rows[0]?.is_new_view;

    if (isNewView) {
      const viewer = await pool.query('SELECT username FROM users WHERE id = $1', [viewerId]);

      await createNotification(pool, {
        userId: viewedId,
        type: 'view',
        fromUserId: viewerId,
        fromUsername: viewer.rows[0].username,
        message: `${viewer.rows[0].username} viewed your profile`,
      });

      await updateFameRating(viewedId);
    }

    res.json({ success: true, message: 'Profile view recorded' });
  } catch (err) {
    console.error('Error recording profile view:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getProfileViews = async (req, res) => {
  const userId = req.user.id;

  try {
    const users = await getUsersWithDistances(
      userId,
      `SELECT
        ${USER_CARD_BASE_COLUMNS},
        pv.viewed_at,
        EXISTS(SELECT 1 FROM likes WHERE liker_id = $1 AND liked_id = u.id) as liked_by_me,
        EXISTS(SELECT 1 FROM likes WHERE liker_id = u.id AND liked_id = $1) as liked_by_them,
        ${MUTUAL_LIKE_SQL}
      FROM profile_views pv
      JOIN users u ON pv.viewer_id = u.id
      ${USER_CARD_JOINS}
      WHERE pv.viewed_id = $1
      AND ${buildBlockCondition()}
      GROUP BY u.id, pv.viewed_at
      ORDER BY pv.viewed_at DESC`,
      [userId],
    );

    if (!users) return res.status(404).json({ error: 'User not found' });
    res.json(users);
  } catch (err) {
    console.error('Error getting profile views:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
