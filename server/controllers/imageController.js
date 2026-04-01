import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isProfileComplete } from '../utils/queryHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadPhoto = async (req, res) => {
  const userId = req.user.id;
  const file = req.file;

  if (!file) return res.status(400).json({ error: 'No image provided' });

  try {
    const countCheck = await pool.query('SELECT COUNT(*) FROM user_images WHERE user_id = $1', [userId]);
    const currentCount = parseInt(countCheck.rows[0].count);

    if (currentCount >= 5) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Maximum 5 photos allowed.' });
    }

    const isProfilePic = currentCount === 0;

    const filePath = `/uploads/${file.filename}`;

    const newImage = await pool.query(
      'INSERT INTO user_images (user_id, file_path, is_profile_picture) VALUES ($1, $2, $3) RETURNING *',
      [userId, filePath, isProfilePic],
    );

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    const hasTags = await pool.query('SELECT user_id FROM user_tags WHERE user_id = $1 LIMIT 1', [userId]);

    if (isProfileComplete(user, true, hasTags.rows.length > 0) && !user.profile_complete) {
      await pool.query('UPDATE users SET profile_complete = true WHERE id = $1', [userId]);
    }

    res.status(201).json(newImage.rows[0]);
  } catch (err) {
    console.error(err);
    if (file) fs.unlinkSync(file.path);
    res.status(500).json({ error: 'Server error uploading image' });
  }
};

export const deletePhoto = async (req, res) => {
  const userId = req.user.id;
  const imageId = req.params.id;

  try {
    const imageCheck = await pool.query('SELECT * FROM user_images WHERE id = $1 AND user_id = $2', [imageId, userId]);

    if (imageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found or unauthorized' });
    }

    const image = imageCheck.rows[0];

    if (image.is_profile_picture) {
      return res
        .status(400)
        .json({ error: 'Cannot delete profile picture. Set another image as profile picture first.' });
    }

    const fullPath = path.join(__dirname, '..', image.file_path);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    await pool.query('DELETE FROM user_images WHERE id = $1', [imageId]);

    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting image' });
  }
};

export const setProfilePicture = async (req, res) => {
  const userId = req.user.id;
  const imageId = req.params.id;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const verify = await client.query('SELECT id FROM user_images WHERE id = $1 AND user_id = $2', [imageId, userId]);
    if (verify.rows.length === 0) {
      throw new Error('Image not found');
    }

    await client.query('UPDATE user_images SET is_profile_picture = FALSE WHERE user_id = $1', [userId]);

    await client.query('UPDATE user_images SET is_profile_picture = TRUE WHERE id = $1', [imageId]);

    await client.query('COMMIT');
    res.json({ message: 'Profile picture updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(400).json({ error: err.message || 'Server error' });
  } finally {
    client.release();
  }
};
