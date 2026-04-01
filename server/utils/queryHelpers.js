import pool from '../config/db.js';
import { calculateDistance } from './distance.js';

export const PROFILE_PICTURE_SQL = `COALESCE(
      (SELECT file_path FROM user_images WHERE user_id = u.id AND is_profile_picture = true LIMIT 1),
      (SELECT file_path FROM user_images WHERE user_id = u.id LIMIT 1)
    ) as profile_picture`;

export const MUTUAL_LIKE_SQL = `EXISTS(
      SELECT 1 FROM likes l1
      WHERE l1.liker_id = $1 AND l1.liked_id = u.id
      AND EXISTS(SELECT 1 FROM likes l2 WHERE l2.liker_id = u.id AND l2.liked_id = $1)
    ) as is_match`;

export const buildBlockCondition = () => `NOT EXISTS(
  SELECT 1 FROM blocks
  WHERE (blocker_id = $1 AND blocked_id = u.id)
     OR (blocker_id = u.id AND blocked_id = $1)
)`;

export const addAgeFilters = (conditions, queryParams, paramIndex, { minAge, maxAge }) => {
  if (minAge) {
    conditions.push(`EXTRACT(YEAR FROM AGE(u.birthdate)) >= $${paramIndex}`);
    queryParams.push(parseInt(minAge));
    paramIndex++;
  }
  if (maxAge) {
    conditions.push(`EXTRACT(YEAR FROM AGE(u.birthdate)) <= $${paramIndex}`);
    queryParams.push(parseInt(maxAge));
    paramIndex++;
  }
  return paramIndex;
};

export const addFameFilters = (conditions, queryParams, paramIndex, { minFame, maxFame }) => {
  if (minFame) {
    conditions.push(`u.fame_rating >= $${paramIndex}`);
    queryParams.push(parseInt(minFame));
    paramIndex++;
  }
  if (maxFame) {
    conditions.push(`u.fame_rating <= $${paramIndex}`);
    queryParams.push(parseInt(maxFame));
    paramIndex++;
  }
  return paramIndex;
};

export const buildUserSelectSQL = (conditions) => `
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
    ${PROFILE_PICTURE_SQL},
    array_remove(array_agg(DISTINCT t.name), NULL) as tags,
    COUNT(DISTINCT ut2.tag_id) FILTER (
      WHERE ut2.tag_id IN (
        SELECT tag_id FROM user_tags WHERE user_id = $1
      )
    ) as common_tags_count,
    EXISTS(SELECT 1 FROM likes WHERE liker_id = $1 AND liked_id = u.id) as liked_by_me,
    EXISTS(SELECT 1 FROM likes WHERE liker_id = u.id AND liked_id = $1) as liked_by_them,
    ${MUTUAL_LIKE_SQL}
  FROM users u
  LEFT JOIN user_tags ut ON u.id = ut.user_id
  LEFT JOIN tags t ON ut.tag_id = t.id
  LEFT JOIN user_tags ut2 ON u.id = ut2.user_id
  WHERE ${conditions.join(' AND ')}
`;

export const addTagFilter = (query, queryParams, paramIndex, filterTags) => {
  if (!filterTags) return { query, paramIndex };
  const tagArray = Array.isArray(filterTags) ? filterTags : [filterTags];
  query += ` AND EXISTS (
    SELECT 1 FROM user_tags ut_filter
    JOIN tags t_filter ON ut_filter.tag_id = t_filter.id
    WHERE ut_filter.user_id = u.id AND LOWER(t_filter.name) = ANY($${paramIndex})
  )`;
  queryParams.push(tagArray.map((t) => t.toLowerCase()));
  return { query, paramIndex: paramIndex + 1 };
};

export const computeDistances = (users, currentUser) =>
  users.map((user) => {
    let distance = null;
    if (currentUser.latitude && currentUser.longitude && user.latitude && user.longitude) {
      distance = calculateDistance(currentUser.latitude, currentUser.longitude, user.latitude, user.longitude);
    }
    return { ...user, distance };
  });

export const USER_CARD_BASE_COLUMNS = `
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
    ${PROFILE_PICTURE_SQL},
    array_remove(array_agg(DISTINCT t.name), NULL) as tags`;

export const USER_CARD_JOINS = `
    LEFT JOIN user_tags ut ON u.id = ut.user_id
    LEFT JOIN tags t ON ut.tag_id = t.id`;

export const getUsersWithDistances = async (userId, query, params) => {
  const { rows } = await pool.query('SELECT latitude, longitude FROM users WHERE id = $1', [userId]);
  if (rows.length === 0) return null;
  const result = await pool.query(query, params);
  return computeDistances(result.rows, rows[0]);
};

export const isProfileComplete = (user, hasImages, hasTags) =>
  !!(
    user.gender &&
    user.sexual_preference &&
    user.biography &&
    user.latitude !== null &&
    user.longitude !== null &&
    hasImages &&
    hasTags
  );
