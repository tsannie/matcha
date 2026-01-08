import pool from '../config/db.js';
import { updateFameRating } from '../utils/fameRating.js';
import { emitNotification, emitToUser } from '../socket.js';
import { calculateDistance } from '../utils/distance.js';

// Like a user
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
    // Check if target user exists and profile is complete
    const targetUser = await pool.query(
      'SELECT id, username, profile_complete FROM users WHERE id = $1',
      [targetUserId]
    );

    if (targetUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!targetUser.rows[0].profile_complete) {
      return res.status(400).json({ error: 'User profile is not complete' });
    }

    // Insert like (will fail if already exists due to UNIQUE constraint)
    await pool.query(
      'INSERT INTO likes (liker_id, liked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, targetUserId]
    );

    // Check for mutual like (match)
    const mutualLike = await pool.query(
      'SELECT id FROM likes WHERE liker_id = $1 AND liked_id = $2',
      [targetUserId, userId]
    );

    const isMatch = mutualLike.rows.length > 0;

    // Create notification for the liked user
    const currentUser = await pool.query(
      'SELECT username FROM users WHERE id = $1',
      [userId]
    );

    const notificationType = isMatch ? 'match' : 'like';
    const notificationMessage = isMatch
      ? `You matched with ${currentUser.rows[0].username}!`
      : `${currentUser.rows[0].username} liked your profile`;

    await pool.query(
      'INSERT INTO notifications (user_id, type, from_user_id, message) VALUES ($1, $2, $3, $4)',
      [targetUserId, notificationType, userId, notificationMessage]
    );

    // If it's a match, create notification for current user too
    if (isMatch) {
      await pool.query(
        'INSERT INTO notifications (user_id, type, from_user_id, message) VALUES ($1, $2, $3, $4)',
        [userId, 'match', targetUserId, `You matched with ${targetUser.rows[0].username}!`]
      );
    }

    // Update fame rating for the liked user
    await updateFameRating(targetUserId);

    // Emit real-time notification via Socket.io
    emitNotification(targetUserId, {
      id: Date.now(),
      type: notificationType,
      from_user_id: userId,
      from_username: currentUser.rows[0].username,
      message: notificationMessage,
      created_at: new Date(),
      is_read: false
    });

    // If match, emit to current user too
    if (isMatch) {
      emitNotification(userId, {
        id: Date.now() + 1,
        type: 'match',
        from_user_id: targetUserId,
        from_username: targetUser.rows[0].username,
        message: `You matched with ${targetUser.rows[0].username}!`,
        created_at: new Date(),
        is_read: false
      });
    }

    res.json({
      success: true,
      isMatch,
      message: isMatch ? 'It\'s a match!' : 'User liked successfully'
    });
  } catch (err) {
    console.error('Error liking user:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Unlike a user
export const unlikeUser = async (req, res) => {
  const userId = req.user.id;
  const targetUserId = parseInt(req.params.userId);

  if (isNaN(targetUserId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    // Check if they were connected (mutual like)
    const wasConnected = await pool.query(
      `SELECT 1 FROM likes l1
       WHERE l1.liker_id = $1 AND l1.liked_id = $2
       AND EXISTS (SELECT 1 FROM likes l2 WHERE l2.liker_id = $2 AND l2.liked_id = $1)`,
      [userId, targetUserId]
    );

    // Delete the like
    const result = await pool.query(
      'DELETE FROM likes WHERE liker_id = $1 AND liked_id = $2 RETURNING id',
      [userId, targetUserId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Like not found' });
    }

    // If they were connected, notify the other user and delete chat history
    if (wasConnected.rows.length > 0) {
      const currentUser = await pool.query(
        'SELECT username FROM users WHERE id = $1',
        [userId]
      );

      // Delete all messages between the two users
      await pool.query(
        'DELETE FROM messages WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)',
        [userId, targetUserId]
      );

      // Emit chat-deleted event to both users to clear their cache
      emitToUser(userId, 'chat-deleted', { userId: targetUserId });
      emitToUser(targetUserId, 'chat-deleted', { userId });

      await pool.query(
        'INSERT INTO notifications (user_id, type, from_user_id, message) VALUES ($1, $2, $3, $4)',
        [targetUserId, 'unlike', userId, `${currentUser.rows[0].username} unliked you`]
      );

      // Emit real-time notification
      emitNotification(targetUserId, {
        id: Date.now(),
        type: 'unlike',
        from_user_id: userId,
        from_username: currentUser.rows[0].username,
        message: `${currentUser.rows[0].username} unliked you`,
        created_at: new Date(),
        is_read: false
      });
    }

    // Update fame rating for the unliked user
    await updateFameRating(targetUserId);

    res.json({ success: true, message: 'User unliked successfully' });
  } catch (err) {
    console.error('Error unliking user:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get users who liked me
export const getLikesReceived = async (req, res) => {
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
        l.created_at as liked_at,
        EXISTS(SELECT 1 FROM likes WHERE liker_id = $1 AND liked_id = u.id) as liked_by_me,
        EXISTS(
          SELECT 1 FROM likes l1
          WHERE l1.liker_id = $1 AND l1.liked_id = u.id
          AND EXISTS(SELECT 1 FROM likes l2 WHERE l2.liker_id = u.id AND l2.liked_id = $1)
        ) as is_match
      FROM likes l
      JOIN users u ON l.liker_id = u.id
      LEFT JOIN user_tags ut ON u.id = ut.user_id
      LEFT JOIN tags t ON ut.tag_id = t.id
      WHERE l.liked_id = $1
      AND NOT EXISTS(
        SELECT 1 FROM blocks
        WHERE (blocker_id = $1 AND blocked_id = u.id)
           OR (blocker_id = u.id AND blocked_id = $1)
      )
      AND NOT EXISTS(
        SELECT 1 FROM likes
        WHERE liker_id = $1 AND liked_id = u.id
      )
      GROUP BY u.id, l.created_at
      ORDER BY l.created_at DESC`,
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
    console.error('Error getting likes received:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get users I liked
export const getLikesSent = async (req, res) => {
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
        l.created_at as liked_at,
        true as liked_by_me,
        EXISTS(SELECT 1 FROM likes WHERE liker_id = u.id AND liked_id = $1) as liked_by_them,
        EXISTS(
          SELECT 1 FROM likes l1
          WHERE l1.liker_id = $1 AND l1.liked_id = u.id
          AND EXISTS(SELECT 1 FROM likes l2 WHERE l2.liker_id = u.id AND l2.liked_id = $1)
        ) as is_match
      FROM likes l
      JOIN users u ON l.liked_id = u.id
      LEFT JOIN user_tags ut ON u.id = ut.user_id
      LEFT JOIN tags t ON ut.tag_id = t.id
      WHERE l.liker_id = $1
      AND NOT EXISTS(
        SELECT 1 FROM blocks
        WHERE (blocker_id = $1 AND blocked_id = u.id)
           OR (blocker_id = u.id AND blocked_id = $1)
      )
      AND NOT EXISTS(
        SELECT 1 FROM likes
        WHERE liker_id = u.id AND liked_id = $1
      )
      GROUP BY u.id, l.created_at
      ORDER BY l.created_at DESC`,
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
    console.error('Error getting likes sent:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get mutual matches
export const getMatches = async (req, res) => {
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
        u.is_online,
        u.last_seen,
        u.latitude,
        u.longitude,
        EXTRACT(YEAR FROM AGE(u.birthdate)) as age,
        COALESCE(
          (SELECT file_path FROM user_images WHERE user_id = u.id AND is_profile_picture = true LIMIT 1),
          (SELECT file_path FROM user_images WHERE user_id = u.id LIMIT 1)
        ) as profile_picture,
        array_remove(array_agg(DISTINCT t.name), NULL) as tags,
        GREATEST(l1.created_at, l2.created_at) as matched_at,
        true as liked_by_me,
        true as is_match
      FROM likes l1
      JOIN likes l2 ON l1.liker_id = l2.liked_id AND l1.liked_id = l2.liker_id
      JOIN users u ON u.id = l1.liked_id
      LEFT JOIN user_tags ut ON u.id = ut.user_id
      LEFT JOIN tags t ON ut.tag_id = t.id
      WHERE l1.liker_id = $1
      AND NOT EXISTS(
        SELECT 1 FROM blocks
        WHERE (blocker_id = $1 AND blocked_id = u.id)
           OR (blocker_id = u.id AND blocked_id = $1)
      )
      GROUP BY u.id, l1.created_at, l2.created_at
      ORDER BY matched_at DESC`,
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
    console.error('Error getting matches:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Check like status between two users
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
      [userId, targetUserId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error checking like status:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
