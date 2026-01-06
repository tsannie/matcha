import pool from '../config/db.js';

export const getRecommendations = async (req, res) => {
  const userId = req.user.id;

  try {
    const query = `
      SELECT
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
        array_remove(array_agg(DISTINCT t.name), NULL) as tags
      FROM users u
      LEFT JOIN user_tags ut ON u.id = ut.user_id
      LEFT JOIN tags t ON ut.tag_id = t.id
      WHERE u.id != $1
      AND u.profile_complete = true
      GROUP BY u.id
      LIMIT 20;
    `;

    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
