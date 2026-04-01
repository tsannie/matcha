import pool from '../config/db.js';
import {
  buildBlockCondition,
  buildUserSelectSQL,
  addAgeFilters,
  addFameFilters,
  addTagFilter,
  computeDistances,
} from '../utils/queryHelpers.js';

// weights: distance 40%, tags 25%, age 20%, fame 15%
const calculateSmartScore = (user, hasUserLocation, currentUserAge) => {
  let distanceScore = 50;
  if (hasUserLocation && user.distance !== null) {
    distanceScore = 100 * Math.exp(-user.distance / 50);
  }

  const tagsScore = Math.min(100, (user.common_tags_count / 5) * 100);

  let ageScore = 50;
  if (currentUserAge && user.age) {
    ageScore = 100 * Math.exp(-Math.abs(currentUserAge - user.age) / 10);
  }

  const fameScore = Math.min(100, user.fame_rating || 0);

  return distanceScore * 0.4 + tagsScore * 0.25 + ageScore * 0.2 + fameScore * 0.15;
};

const filterByDistance = (users, { minDistance, maxDistance }) => {
  let result = users;
  if (maxDistance) result = result.filter((u) => u.distance !== null && u.distance <= parseFloat(maxDistance));
  if (minDistance && parseFloat(minDistance) > 0)
    result = result.filter((u) => u.distance !== null && u.distance >= parseFloat(minDistance));
  return result;
};

const sortByDistance = (users, orderDirection) =>
  [...users].sort((a, b) => {
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return orderDirection === 'ASC' ? a.distance - b.distance : b.distance - a.distance;
  });

export const getRecommendations = async (req, res) => {
  const userId = req.user.id;
  const {
    sortBy = 'smart',
    order = 'desc',
    minAge, maxAge,
    minFame, maxFame,
    minDistance, maxDistance,
    tags: filterTags,
    limit = 50,
    offset = 0,
  } = req.query;

  try {
    const { rows } = await pool.query(
      `SELECT gender, sexual_preference, latitude, longitude,
       EXTRACT(YEAR FROM AGE(birthdate)) as age
       FROM users WHERE id = $1`,
      [userId],
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const currentUser = rows[0];

    const conditions = ['u.id != $1', 'u.profile_complete = true', buildBlockCondition()];
    const queryParams = [userId];
    let paramIndex = 2;

    // Exclude pairs that are already mutually matched
    conditions.push(`NOT EXISTS(
      SELECT 1 FROM likes l1
      WHERE l1.liker_id = $1 AND l1.liked_id = u.id
      AND EXISTS(SELECT 1 FROM likes l2 WHERE l2.liker_id = u.id AND l2.liked_id = $1)
    )`);

    // Filter compatible profiles based on sexual preference
    const pref = currentUser.sexual_preference || 'bisexual';
    const gender = currentUser.gender;
    if (pref === 'heterosexual') {
      conditions.push(`u.gender = $${paramIndex}`);
      queryParams.push(gender === 'male' ? 'female' : 'male');
      paramIndex++;
      conditions.push(`(u.sexual_preference IN ('heterosexual', 'bisexual') OR u.sexual_preference IS NULL)`);
    } else if (pref === 'homosexual') {
      conditions.push(`u.gender = $${paramIndex}`);
      queryParams.push(gender);
      paramIndex++;
      conditions.push(`(u.sexual_preference IN ('homosexual', 'bisexual') OR u.sexual_preference IS NULL)`);
    }

    paramIndex = addAgeFilters(conditions, queryParams, paramIndex, { minAge, maxAge });
    paramIndex = addFameFilters(conditions, queryParams, paramIndex, { minFame, maxFame });

    let query = buildUserSelectSQL(conditions);
    ({ query, paramIndex } = addTagFilter(query, queryParams, paramIndex, filterTags));
    query += ' GROUP BY u.id';

    const orderDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const sortKey = sortBy.toLowerCase();

    // SQL-side sorting and pagination for non-JS sorts
    const sqlOrderMap = { age: 'age', fame: 'u.fame_rating', tags: 'common_tags_count' };
    if (sqlOrderMap[sortKey]) {
      query += ` ORDER BY ${sqlOrderMap[sortKey]} ${orderDirection}`;
      if (sortKey === 'tags') query += `, u.fame_rating DESC`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(parseInt(limit), parseInt(offset));
    }

    const result = await pool.query(query, queryParams);
    let users = computeDistances(result.rows, currentUser);
    users = filterByDistance(users, { minDistance, maxDistance });

    if (sortKey === 'distance') {
      users = sortByDistance(users, orderDirection);
    } else if (sortKey === 'smart') {
      const hasLocation = !!(currentUser.latitude && currentUser.longitude);
      const currentAge = currentUser.age ? parseInt(currentUser.age) : null;
      users = users
        .map((u) => ({ ...u, smart_score: calculateSmartScore(u, hasLocation, currentAge) }))
        .sort((a, b) => (orderDirection === 'ASC' ? a.smart_score - b.smart_score : b.smart_score - a.smart_score));
    }

    if (['smart', 'distance'].includes(sortKey)) {
      users = users.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    }

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const searchUsers = async (req, res) => {
  const userId = req.user.id;
  const {
    sortBy = 'fame',
    order = 'desc',
    minAge, maxAge,
    minFame, maxFame,
    minDistance, maxDistance,
    tags: filterTags,
    gender,
    limit = 50,
    offset = 0,
  } = req.query;

  try {
    const { rows } = await pool.query('SELECT latitude, longitude FROM users WHERE id = $1', [userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const currentUser = rows[0];

    const conditions = ['u.id != $1', 'u.profile_complete = true', buildBlockCondition()];
    const queryParams = [userId];
    let paramIndex = 2;

    if (gender) {
      conditions.push(`u.gender = $${paramIndex}`);
      queryParams.push(gender);
      paramIndex++;
    }

    paramIndex = addAgeFilters(conditions, queryParams, paramIndex, { minAge, maxAge });
    paramIndex = addFameFilters(conditions, queryParams, paramIndex, { minFame, maxFame });

    let query = buildUserSelectSQL(conditions);
    ({ query, paramIndex } = addTagFilter(query, queryParams, paramIndex, filterTags));
    query += ' GROUP BY u.id';

    const orderDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const sortKey = sortBy.toLowerCase();

    const orderClauses = {
      age: `ORDER BY age ${orderDirection}`,
      fame: `ORDER BY u.fame_rating ${orderDirection}`,
      tags: `ORDER BY common_tags_count ${orderDirection}`,
    };
    query += ` ${orderClauses[sortKey] ?? `ORDER BY u.fame_rating ${orderDirection}`}`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, queryParams);
    let users = computeDistances(result.rows, currentUser);
    users = filterByDistance(users, { minDistance, maxDistance });

    if (sortKey === 'distance') {
      users = sortByDistance(users, orderDirection);
    }

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
