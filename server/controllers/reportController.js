import pool from '../config/db.js';
import { updateFameRating } from '../utils/fameRating.js';

export const reportUser = async (req, res) => {
  const reporterId = req.user.id;
  const reportedId = parseInt(req.params.userId);
  const { reason } = req.body;

  if (isNaN(reportedId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (reporterId === reportedId) {
    return res.status(400).json({ error: 'Cannot report yourself' });
  }

  try {
    const reportedUser = await pool.query('SELECT id, username FROM users WHERE id = $1', [reportedId]);

    if (reportedUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.query(
      `INSERT INTO reports (reporter_id, reported_id, reason)
       VALUES ($1, $2, $3)
       ON CONFLICT (reporter_id, reported_id)
       DO UPDATE SET reason = $3, created_at = CURRENT_TIMESTAMP`,
      [reporterId, reportedId, reason || null],
    );

    await updateFameRating(reportedId);

    console.log(
      `🚨 User ${reporterId} reported user ${reportedId} (${reportedUser.rows[0].username}) as fake account. Reason: ${reason || 'No reason provided'}`,
    );

    res.json({ success: true, message: 'User reported successfully' });
  } catch (err) {
    console.error('Error reporting user:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getMyReports = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT
        u.id,
        u.username,
        u.firstname,
        u.lastname,
        r.reason,
        r.created_at as reported_at
      FROM reports r
      JOIN users u ON r.reported_id = u.id
      WHERE r.reporter_id = $1
      ORDER BY r.created_at DESC`,
      [userId],
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error getting reports:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
