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

export const getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const userResult = await pool.query(
      'SELECT id, username, email, firstname, lastname, gender, sexual_preference, biography, fame_rating, latitude, longitude, profile_complete FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const userProfile = {
      ...userResult.rows[0],
      tags: await getTagsFromUserId(userId),
    };

    res.json(userProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { gender, sexual_preference, biography, latitude, longitude } = req.body;

  const error = validateProfileUpdate(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const query = `
      UPDATE users
      SET
        gender = COALESCE($1, gender),
        sexual_preference = COALESCE($2, sexual_preference),
        biography = COALESCE($3, biography),
        latitude = COALESCE($4, latitude),
        longitude = COALESCE($5, longitude)
      WHERE id = $6
      RETURNING *;
    `;

    const result = await pool.query(query, [gender, sexual_preference, biography, latitude, longitude, userId]);

    res.json({ message: 'Profile updated', user: result.rows[0] });
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
