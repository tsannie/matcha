import pool from '../config/db.js';
import { validateProfileUpdate } from '../utils/validation.js';

const getTagsFromUserId = async (userId) => {
  const tagsResult = await pool.query(
    `SELECT tags.name
     FROM tags
     JOIN user_tags ON tags.id = user_tags.tag_id
     WHERE user_tags.user_id = $1`,
    [userId]
  );

  return tagsResult.rows.map((row) => row.name);
};

const getImagesFromUserId = async (userId) => {
  const imagesResult = await pool.query(
    'SELECT id, file_path, is_profile_picture FROM user_images WHERE user_id = $1 ORDER BY uploaded_at ASC',
    [userId]
  );

  return imagesResult.rows;
};

export const getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const userResult = await pool.query(
      'SELECT id, username, email, firstname, lastname, gender, sexual_preference, birthdate, biography, fame_rating, latitude, longitude, profile_complete FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const userProfile = {
      ...userResult.rows[0],
      tags: await getTagsFromUserId(userId),
      images: await getImagesFromUserId(userId),
    };

    res.json(userProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { gender, sexual_preference, birthdate, biography, latitude, longitude } = req.body;

  const error = validateProfileUpdate(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const query = `
      UPDATE users
      SET
        gender = COALESCE($1, gender),
        sexual_preference = COALESCE($2, sexual_preference),
        birthdate = COALESCE($3, birthdate),
        biography = COALESCE($4, biography),
        latitude = COALESCE($5, latitude),
        longitude = COALESCE($6, longitude)
      WHERE id = $7
      RETURNING *;
    `;

    const result = await pool.query(query, [gender, sexual_preference, birthdate, biography, latitude, longitude, userId]);

    // Check if profile is now complete and update flag
    const user = result.rows[0];
    const hasImages = await pool.query('SELECT id FROM user_images WHERE user_id = $1 LIMIT 1', [userId]);
    const hasTags = await pool.query('SELECT user_id FROM user_tags WHERE user_id = $1 LIMIT 1', [userId]);

    const isComplete =
      user.gender &&
      user.sexual_preference &&
      user.biography &&
      user.latitude !== null &&
      user.longitude !== null &&
      hasImages.rows.length > 0 &&
      hasTags.rows.length > 0;

    if (isComplete && !user.profile_complete) {
      await pool.query('UPDATE users SET profile_complete = true WHERE id = $1', [userId]);
      user.profile_complete = true;
    }

    res.json({ message: 'Profile updated', user });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getTags = async (req, res) => {
  try {
    const result = await pool.query('SELECT name FROM tags ORDER BY name ASC');

    const tags = result.rows.map((row) => row.name);
    res.json(tags);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error fetching tags' });
  }
};

export const updateProfileTags = async (req, res) => {
  const userId = req.user.id;
  const { tags } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM user_tags WHERE user_id = $1', [userId]);

    for (const tagName of tags) {
      const cleanTag = tagName.trim().toLowerCase();
      const tagQuery = `
        WITH inserted_tag AS (
          INSERT INTO tags (name) VALUES ($1)
          ON CONFLICT (name) DO NOTHING
          RETURNING id
        )
        SELECT id FROM inserted_tag
        UNION ALL
        SELECT id FROM tags WHERE name = $1
        LIMIT 1;
      `;

      const tagResult = await client.query(tagQuery, [cleanTag]);
      const tagId = tagResult.rows[0].id;

      await client.query('INSERT INTO user_tags (user_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
        userId,
        tagId,
      ]);
    }

    // Check if profile is now complete and update flag
    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    const hasImages = await client.query('SELECT id FROM user_images WHERE user_id = $1 LIMIT 1', [userId]);

    const isComplete =
      user.gender &&
      user.sexual_preference &&
      user.biography &&
      user.latitude !== null &&
      user.longitude !== null &&
      hasImages.rows.length > 0 &&
      tags.length > 0;

    if (isComplete && !user.profile_complete) {
      await client.query('UPDATE users SET profile_complete = true WHERE id = $1', [userId]);
    }

    await client.query('COMMIT'); // On valide tout
    res.json({ message: 'Tags updated successfully', tags });
  } catch (err) {
    await client.query('ROLLBACK'); // En cas d'erreur, on annule tout
    console.error(err.message);
    res.status(500).json({ error: 'Server error updating tags' });
  } finally {
    client.release(); // On libère la connexion
  }
};

export const getUserProfile = async (req, res) => {
  const currentUserId = req.user.id;
  const targetUserId = parseInt(req.params.userId);

  if (isNaN(targetUserId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    // Check if users have blocked each other
    const blockCheck = await pool.query(
      `SELECT id FROM blocks
       WHERE (blocker_id = $1 AND blocked_id = $2)
          OR (blocker_id = $2 AND blocked_id = $1)`,
      [currentUserId, targetUserId]
    );

    if (blockCheck.rows.length > 0) {
      return res.status(403).json({ error: 'Cannot view this profile' });
    }

    // Get user profile with like status
    const userResult = await pool.query(
      `SELECT
        u.id, u.username, u.firstname, u.lastname, u.gender,
        u.sexual_preference, u.birthdate, u.biography, u.fame_rating,
        u.is_online, u.last_seen,
        EXISTS(SELECT 1 FROM likes WHERE liker_id = $1 AND liked_id = u.id) as liked_by_me,
        EXISTS(SELECT 1 FROM likes WHERE liker_id = u.id AND liked_id = $1) as liked_by_them,
        EXISTS(
          SELECT 1 FROM likes l1
          WHERE l1.liker_id = $1 AND l1.liked_id = u.id
          AND EXISTS(SELECT 1 FROM likes l2 WHERE l2.liker_id = u.id AND l2.liked_id = $1)
        ) as is_match
       FROM users u
       WHERE u.id = $2 AND u.profile_complete = true`,
      [currentUserId, targetUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    const userProfile = {
      ...user,
      images: await getImagesFromUserId(targetUserId),
      tags: await getTagsFromUserId(targetUserId),
    };

    res.json(userProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
