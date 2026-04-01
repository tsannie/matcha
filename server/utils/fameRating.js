import pool from '../config/db.js';

// Fame rating formula:
// - Likes received: +5 points each
// - Profile views: +1 point each
// - Photos uploaded: +2 points each
// - Profile complete: +10 points bonus
export const updateFameRating = async (userId) => {
  try {
    const query = `
      UPDATE users
      SET fame_rating = (
        SELECT COALESCE(
          (SELECT COUNT(*) * 5 FROM likes WHERE liked_id = $1) +
          (SELECT COUNT(*) FROM profile_views WHERE viewed_id = $1) +
          (SELECT COUNT(*) * 2 FROM user_images WHERE user_id = $1) +
          CASE WHEN profile_complete THEN 10 ELSE 0 END,
          0
        )
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
