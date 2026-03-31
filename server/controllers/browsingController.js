import pool from '../config/db.js';
import { calculateDistance } from '../utils/distance.js';

/**
 * Calculate smart match score for a user
 * Score = distance × 0.40 + tags × 0.25 + age × 0.20 + fame × 0.15
 * @param {Object} user - User object with distance, common_tags_count, fame_rating, age
 * @param {boolean} hasUserLocation - Whether the current user has location set
 * @param {number|null} currentUserAge - Current user's age for age proximity calculation
 * @returns {number} Smart score (0-100)
 */
const calculateSmartScore = (user, hasUserLocation, currentUserAge) => {
  // Distance score: 100 × exp(-distance_km / 50) → closer = higher score
  // If no location, use neutral score of 50
  let distanceScore = 50;
  if (hasUserLocation && user.distance !== null) {
    distanceScore = 100 * Math.exp(-user.distance / 50);
  }

  // Tags score: min(100, (common_tags / 5) × 100)
  const tagsScore = Math.min(100, (user.common_tags_count / 5) * 100);

  // Age score: 100 × exp(-ageDiff / 10) → closer in age = higher score
  // If no age data, use neutral score of 50
  let ageScore = 50;
  if (currentUserAge && user.age) {
    const ageDiff = Math.abs(currentUserAge - user.age);
    ageScore = 100 * Math.exp(-ageDiff / 10);
  }

  // Fame score: min(100, fame_rating)
  const fameScore = Math.min(100, user.fame_rating || 0);

  // Weighted composite score
  return (distanceScore * 0.40) + (tagsScore * 0.25) + (ageScore * 0.20) + (fameScore * 0.15);
};

export const getRecommendations = async (req, res) => {
  const userId = req.user.id;

  // Query parameters for sorting and filtering
  const {
    sortBy = 'smart', // smart, age, distance, fame, tags
    order = 'desc',
    minAge,
    maxAge,
    minFame,
    maxFame,
    minDistance,
    maxDistance,
    tags: filterTags,
    limit = 50,
    offset = 0
  } = req.query;

  try {
    // Get current user data for matching algorithm
    const currentUserResult = await pool.query(
      `SELECT gender, sexual_preference, latitude, longitude,
       EXTRACT(YEAR FROM AGE(birthdate)) as age
       FROM users WHERE id = $1`,
      [userId]
    );

    if (currentUserResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = currentUserResult.rows[0];

    // Build WHERE conditions for filters
    const conditions = ['u.id != $1', 'u.profile_complete = true'];
    const queryParams = [userId];
    let paramIndex = 2;

    // Filter out blocked users (both directions)
    conditions.push(`NOT EXISTS(
      SELECT 1 FROM blocks
      WHERE (blocker_id = $1 AND blocked_id = u.id)
         OR (blocker_id = u.id AND blocked_id = $1)
    )`);

    // Filter out already matched users (mutual likes)
    conditions.push(`NOT EXISTS(
      SELECT 1 FROM likes l1
      WHERE l1.liker_id = $1 AND l1.liked_id = u.id
      AND EXISTS(SELECT 1 FROM likes l2 WHERE l2.liker_id = u.id AND l2.liked_id = $1)
    )`);

    // Sexual preference filtering
    const userPreference = currentUser.sexual_preference || 'bisexual';
    const userGender = currentUser.gender;

    if (userPreference === 'heterosexual') {
      if (userGender === 'male') {
        conditions.push(`u.gender = 'female'`);
        conditions.push(`(u.sexual_preference IN ('heterosexual', 'bisexual') OR u.sexual_preference IS NULL)`);
      } else if (userGender === 'female') {
        conditions.push(`u.gender = 'male'`);
        conditions.push(`(u.sexual_preference IN ('heterosexual', 'bisexual') OR u.sexual_preference IS NULL)`);
      }
    } else if (userPreference === 'homosexual') {
      conditions.push(`u.gender = $${paramIndex}`);
      queryParams.push(userGender);
      paramIndex++;
      conditions.push(`(u.sexual_preference IN ('homosexual', 'bisexual') OR u.sexual_preference IS NULL)`);
    }
    // If bisexual or null, show all genders

    // Age filter
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

    // Fame rating filter
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

    // Build query
    let query = `
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
        array_remove(array_agg(DISTINCT t.name), NULL) as tags,
        COUNT(DISTINCT ut2.tag_id) FILTER (
          WHERE ut2.tag_id IN (
            SELECT tag_id FROM user_tags WHERE user_id = $1
          )
        ) as common_tags_count,
        EXISTS(SELECT 1 FROM likes WHERE liker_id = $1 AND liked_id = u.id) as liked_by_me,
        EXISTS(SELECT 1 FROM likes WHERE liker_id = u.id AND liked_id = $1) as liked_by_them,
        EXISTS(
          SELECT 1 FROM likes l1
          WHERE l1.liker_id = $1 AND l1.liked_id = u.id
          AND EXISTS(SELECT 1 FROM likes l2 WHERE l2.liker_id = u.id AND l2.liked_id = $1)
        ) as is_match
      FROM users u
      LEFT JOIN user_tags ut ON u.id = ut.user_id
      LEFT JOIN tags t ON ut.tag_id = t.id
      LEFT JOIN user_tags ut2 ON u.id = ut2.user_id
      WHERE ${conditions.join(' AND ')}
    `;

    // Tag filter - users must have at least one of the specified tags
    if (filterTags) {
      const tagArray = Array.isArray(filterTags) ? filterTags : [filterTags];
      const lowerTagArray = tagArray.map(tag => tag.toLowerCase());
      query += ` AND EXISTS (
        SELECT 1 FROM user_tags ut_filter
        JOIN tags t_filter ON ut_filter.tag_id = t_filter.id
        WHERE ut_filter.user_id = u.id AND LOWER(t_filter.name) = ANY($${paramIndex})
      )`;
      queryParams.push(lowerTagArray);
      paramIndex++;
    }

    query += ' GROUP BY u.id';

    // Sorting
    let orderByClause = '';
    const orderDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    switch (sortBy.toLowerCase()) {
      case 'age':
        orderByClause = `ORDER BY age ${orderDirection}`;
        break;
      case 'fame':
        orderByClause = `ORDER BY u.fame_rating ${orderDirection}`;
        break;
      case 'tags':
        orderByClause = `ORDER BY common_tags_count ${orderDirection}, u.fame_rating DESC`;
        break;
      case 'distance':
        // Distance will be calculated after query
        break;
      case 'smart':
      default:
        // Smart sorting done in JavaScript after distance calculation
        // Uses weighted composite score: 40% distance + 25% tags + 20% age + 15% fame
        break;
    }

    if (orderByClause) {
      query += ' ' + orderByClause;
    }

    // For smart/distance, sorting happens in JS after distance calculation,
    // so SQL pagination would cut the pool before sorting — apply it in JS instead.
    const sqlSortModes = ['age', 'fame', 'tags'];
    if (sqlSortModes.includes(sortBy.toLowerCase())) {
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(parseInt(limit), parseInt(offset));
    }

    const result = await pool.query(query, queryParams);

    // Calculate distance for each user and filter if needed
    let users = result.rows.map(user => {
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

    // Apply distance filter if specified
    if (maxDistance) {
      users = users.filter(user => user.distance !== null && user.distance <= parseFloat(maxDistance));
    }
    if (minDistance && parseFloat(minDistance) > 0) {
      users = users.filter(user => user.distance !== null && user.distance >= parseFloat(minDistance));
    }

    // Sort by distance if requested
    if (sortBy.toLowerCase() === 'distance') {
      users.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return orderDirection === 'ASC' ? a.distance - b.distance : b.distance - a.distance;
      });
    }

    // Smart sort: weighted composite score (40% distance + 25% tags + 20% age + 15% fame)
    if (sortBy.toLowerCase() === 'smart') {
      const hasUserLocation = !!(currentUser.latitude && currentUser.longitude);
      const currentUserAge = currentUser.age ? parseInt(currentUser.age) : null;
      users = users.map(user => ({
        ...user,
        smart_score: calculateSmartScore(user, hasUserLocation, currentUserAge)
      }));
      users.sort((a, b) => orderDirection === 'ASC'
        ? a.smart_score - b.smart_score
        : b.smart_score - a.smart_score);
    }

    // Apply pagination in JS for smart/distance (SQL pagination was skipped above)
    if (['smart', 'distance'].includes(sortBy.toLowerCase())) {
      const off = parseInt(offset);
      const lim = parseInt(limit);
      users = users.slice(off, off + lim);
    }

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Advanced search with custom criteria
export const searchUsers = async (req, res) => {
  const userId = req.user.id;

  // Query parameters for searching
  const {
    sortBy = 'fame', // age, distance, fame, tags
    order = 'desc',
    minAge,
    maxAge,
    minFame,
    maxFame,
    minDistance,
    maxDistance,
    location, // City or neighborhood search
    tags: filterTags,
    gender,
    limit = 50,
    offset = 0
  } = req.query;

  try {
    // Get current user data
    const currentUserResult = await pool.query(
      'SELECT latitude, longitude FROM users WHERE id = $1',
      [userId]
    );

    if (currentUserResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = currentUserResult.rows[0];

    // Build WHERE conditions
    const conditions = ['u.id != $1', 'u.profile_complete = true'];
    const queryParams = [userId];
    let paramIndex = 2;

    // Filter out blocked users (both directions)
    conditions.push(`NOT EXISTS(
      SELECT 1 FROM blocks
      WHERE (blocker_id = $1 AND blocked_id = u.id)
         OR (blocker_id = u.id AND blocked_id = $1)
    )`);

    // Gender filter
    if (gender) {
      conditions.push(`u.gender = $${paramIndex}`);
      queryParams.push(gender);
      paramIndex++;
    }

    // Age filter
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

    // Fame rating filter
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

    // Location text search (placeholder for city/neighborhood)
    // This would need a proper location field in the database for production
    if (location) {
      // For now, we can add a location text field later
      // conditions.push(`u.location ILIKE $${paramIndex}`);
      // queryParams.push(`%${location}%`);
      // paramIndex++;
    }

    // Build query
    let query = `
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
        array_remove(array_agg(DISTINCT t.name), NULL) as tags,
        COUNT(DISTINCT ut2.tag_id) FILTER (
          WHERE ut2.tag_id IN (
            SELECT tag_id FROM user_tags WHERE user_id = $1
          )
        ) as common_tags_count,
        EXISTS(SELECT 1 FROM likes WHERE liker_id = $1 AND liked_id = u.id) as liked_by_me,
        EXISTS(SELECT 1 FROM likes WHERE liker_id = u.id AND liked_id = $1) as liked_by_them,
        EXISTS(
          SELECT 1 FROM likes l1
          WHERE l1.liker_id = $1 AND l1.liked_id = u.id
          AND EXISTS(SELECT 1 FROM likes l2 WHERE l2.liker_id = u.id AND l2.liked_id = $1)
        ) as is_match
      FROM users u
      LEFT JOIN user_tags ut ON u.id = ut.user_id
      LEFT JOIN tags t ON ut.tag_id = t.id
      LEFT JOIN user_tags ut2 ON u.id = ut2.user_id
      WHERE ${conditions.join(' AND ')}
    `;

    // Tag filter - users must have at least one of the specified tags
    if (filterTags) {
      const tagArray = Array.isArray(filterTags) ? filterTags : [filterTags];
      const lowerTagArray = tagArray.map(tag => tag.toLowerCase());
      query += ` AND EXISTS (
        SELECT 1 FROM user_tags ut_filter
        JOIN tags t_filter ON ut_filter.tag_id = t_filter.id
        WHERE ut_filter.user_id = u.id AND LOWER(t_filter.name) = ANY($${paramIndex})
      )`;
      queryParams.push(lowerTagArray);
      paramIndex++;
    }

    query += ' GROUP BY u.id';

    // Sorting
    let orderByClause = '';
    const orderDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    switch (sortBy.toLowerCase()) {
      case 'age':
        orderByClause = `ORDER BY age ${orderDirection}`;
        break;
      case 'fame':
        orderByClause = `ORDER BY u.fame_rating ${orderDirection}`;
        break;
      case 'tags':
        orderByClause = `ORDER BY common_tags_count ${orderDirection}`;
        break;
      case 'distance':
        // Distance will be calculated after query
        break;
      default:
        orderByClause = `ORDER BY u.fame_rating ${orderDirection}`;
        break;
    }

    if (orderByClause) {
      query += ' ' + orderByClause;
    }

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, queryParams);

    // Calculate distance for each user and filter if needed
    let users = result.rows.map(user => {
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

    // Apply distance filter if specified
    if (maxDistance) {
      users = users.filter(user => user.distance !== null && user.distance <= parseFloat(maxDistance));
    }
    if (minDistance && parseFloat(minDistance) > 0) {
      users = users.filter(user => user.distance !== null && user.distance >= parseFloat(minDistance));
    }

    // Sort by distance if requested
    if (sortBy.toLowerCase() === 'distance') {
      users.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return orderDirection === 'ASC' ? a.distance - b.distance : b.distance - a.distance;
      });
    }

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
