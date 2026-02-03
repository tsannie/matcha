import pool from '../config/db.js';
import { updateFameRating } from '../utils/fameRating.js';
import { emitNotification } from '../socket.js';
import { calculateDistance } from '../utils/distance.js';

// Record a profile view
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
    // Check if viewed user exists
    const viewedUser = await pool.query(
      'SELECT id, username FROM users WHERE id = $1',
      [viewedId]
    );

    if (viewedUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Upsert profile view (update viewed_at if exists, insert if not)
    // RETURNING tells us if this was an insert or update
    const viewResult = await pool.query(
      `INSERT INTO profile_views (viewer_id, viewed_id, viewed_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (viewer_id, viewed_id)
       DO UPDATE SET viewed_at = CURRENT_TIMESTAMP
       RETURNING (xmax = 0) AS is_new_view`,
      [viewerId, viewedId]
    );

    const isNewView = viewResult.rows[0]?.is_new_view;

    // Only create notification if this is a new view (not an update)
    if (isNewView) {
      const viewer = await pool.query(
        'SELECT username FROM users WHERE id = $1',
        [viewerId]
      );

      await pool.query(
        'INSERT INTO notifications (user_id, type, from_user_id, message) VALUES ($1, $2, $3, $4)',
        [viewedId, 'view', viewerId, `${viewer.rows[0].username} viewed your profile`]
      );

      // Update fame rating for the viewed user
      await updateFameRating(viewedId);

      // Emit real-time notification via Socket.io
      emitNotification(viewedId, {
        id: Date.now(),
        type: 'view',
        from_user_id: viewerId,
        from_username: viewer.rows[0].username,
        message: `${viewer.rows[0].username} viewed your profile`,
        created_at: new Date(),
        is_read: false
      });
    }

    res.json({ success: true, message: 'Profile view recorded' });
  } catch (err) {
    console.error('Error recording profile view:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get users who viewed my profile
export const getProfileViews = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get current user coordinates for distance calculation
    const currentUserResult = await pool.query(
      'SELECT latitude, longitude FROM users WHERE id = $1',
      [userId]
    );

    if (currentUserResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = currentUserResult.rows[0];

    const result = await pool.query(
      `SELECT
        u.id,
        u.username,
        u.firstname,
        u.lastname,
        u.birthdate,
        u.gender,
        u.biography,
        u.fame_rating,
        u.latitude,
        u.longitude,
        EXTRACT(YEAR FROM AGE(u.birthdate)) as age,
        COALESCE(
          (SELECT file_path FROM user_images WHERE user_id = u.id AND is_profile_picture = true LIMIT 1),
          (SELECT file_path FROM user_images WHERE user_id = u.id LIMIT 1)
        ) as profile_picture,
        array_remove(array_agg(DISTINCT t.name), NULL) as tags,
        pv.viewed_at,
        EXISTS(SELECT 1 FROM likes WHERE liker_id = $1 AND liked_id = u.id) as liked_by_me,
        EXISTS(SELECT 1 FROM likes WHERE liker_id = u.id AND liked_id = $1) as liked_by_them,
        EXISTS(
          SELECT 1 FROM likes l1
          WHERE l1.liker_id = $1 AND l1.liked_id = u.id
          AND EXISTS(SELECT 1 FROM likes l2 WHERE l2.liker_id = u.id AND l2.liked_id = $1)
        ) as is_match
      FROM profile_views pv
      JOIN users u ON pv.viewer_id = u.id
      LEFT JOIN user_tags ut ON u.id = ut.user_id
      LEFT JOIN tags t ON ut.tag_id = t.id
      WHERE pv.viewed_id = $1
      AND NOT EXISTS(
        SELECT 1 FROM blocks
        WHERE (blocker_id = $1 AND blocked_id = u.id)
           OR (blocker_id = u.id AND blocked_id = $1)
      )
      GROUP BY u.id, pv.viewed_at
      ORDER BY pv.viewed_at DESC`,
      [userId]
    );

    // Calculate distance for each user
    const users = result.rows.map(user => {
      let distance = null;
      if (currentUser.latitude && currentUser.longitude && user.latitude && user.longitude) {
        distance = calculateDistance(
          currentUser.latitude,
          currentUser.longitude,
          user.latitude,
          user.longitude
        );
      }
      return { ...user, distance };
    });

    res.json(users);
  } catch (err) {
    console.error('Error getting profile views:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
