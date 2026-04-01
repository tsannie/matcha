import pool from '../config/db.js';

// Fame rating formula:
// - Like ratio (likes / views): ×50 points  → quality over quantity
// - Photos uploaded: +2 points each
// - Profile complete: +10 points bonus
// - Blocked by others: -3 points each
// - Reported by others: -5 points each
export const updateFameRating = async (userId) => {
  try {
    const query = `
      UPDATE users
      SET fame_rating = (
        WITH stats AS (
          SELECT
            (SELECT COUNT(*) FROM likes WHERE liked_id = $1)::float AS likes,
            (SELECT COUNT(*) FROM profile_views WHERE viewed_id = $1)::float AS views,
            (SELECT COUNT(*) FROM user_images WHERE user_id = $1) AS photos,
            (SELECT COUNT(*) FROM blocks WHERE blocked_id = $1) AS blocks,
            (SELECT COUNT(*) FROM reports WHERE reported_id = $1) AS reports
        )
        SELECT COALESCE(
          CASE WHEN views = 0 THEN 0 ELSE LEAST(1.0, likes / views) END * 80
          + photos * 2
          + CASE WHEN profile_complete THEN 10 ELSE 0 END
          - blocks * 3
          - reports * 5,
          0
        )
        FROM stats
      )
      WHERE id = $1
      RETURNING fame_rating
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length > 0) {
      return result.rows[0].fame_rating;
    }

    return 0;
  } catch (err) {
    console.error('Error updating fame rating:', err);
    throw err;
  }
};

export const getFameRating = async (userId) => {
  try {
    const result = await pool.query('SELECT fame_rating FROM users WHERE id = $1', [userId]);

    if (result.rows.length > 0) {
      return result.rows[0].fame_rating;
    }

    return 0;
  } catch (err) {
    console.error('Error getting fame rating:', err);
    throw err;
  }
};
