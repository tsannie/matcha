import pool from '../config/db.js';

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
    maxDistance,
    tags: filterTags,
    limit = 50,
    offset = 0
  } = req.query;

  try {
    // Get current user data for matching algorithm
    const currentUserResult = await pool.query(
      'SELECT gender, sexual_preference, latitude, longitude FROM users WHERE id = $1',
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
        orderByClause = `ORDER BY common_tags_count ${orderDirection}`;
        break;
      case 'distance':
        // Distance will be calculated after query
        break;
      case 'smart':
      default:
        // Smart sorting: prioritize common tags, then fame, then distance
        orderByClause = `ORDER BY common_tags_count DESC, u.fame_rating DESC`;
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
