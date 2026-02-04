import { faker } from '@faker-js/faker';
import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

if (!process.env.DB_PASSWORD) {
  console.error('❌ Error: DB_PASSWORD not found. Check your .env file');
  process.exit(1);
}

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD),
  port: process.env.DB_PORT,
});

const USERS_TO_CREATE = 500;
const PARIS_LAT = 48.8566;
const PARIS_LON = 2.3522;
const CSV_FILE = 'users_data.csv';

const TAGS_LIST = [
  'vegan',
  'geek',
  'gym',
  'photography',
  'travel',
  'foodie',
  'music',
  'art',
  'tech',
  'nature',
  'cinema',
  'catlover',
  'doglover',
  'hiking',
  'coding',
];

const seed = async () => {
  try {
    console.log('🌱 Starting seed...');
    console.log(`Connecting to database: ${process.env.DB_NAME} as ${process.env.DB_USER}`);

    const csvHeader = 'ID,Email,Username,Password,Firstname,Lastname,Gender,Orientation,Age,Fame,Latitude,Longitude\n';
    fs.writeFileSync(CSV_FILE, csvHeader);

    await pool.query(
      'TRUNCATE notifications, blocks, reports, profile_views, likes, user_images, user_tags, tags, users RESTART IDENTITY CASCADE',
    );

    const tagIds = [];
    for (const tagName of TAGS_LIST) {
      const res = await pool.query('INSERT INTO tags (name) VALUES ($1) RETURNING id', [tagName]);
      tagIds.push({ id: res.rows[0].id, name: tagName });
    }

    for (let i = 0; i < USERS_TO_CREATE; i++) {
      const sex = faker.person.sexType();
      const firstname = faker.person.firstName(sex);
      const lastname = faker.person.lastName();
      const username = (firstname + lastname + i).toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = faker.internet.email({ firstName: firstname, lastName: lastname + i });
      const password = faker.internet.password({ length: 12, memorable: false });
      const hashedPassword = await bcrypt.hash(password, 10);

      const latitude = PARIS_LAT + (Math.random() - 0.5) * 0.5;
      const longitude = PARIS_LON + (Math.random() - 0.5) * 0.5;

      const gender = sex;
      let sexual_preference;
      const randPref = Math.random();

      if (randPref < 0.7) sexual_preference = 'heterosexual';
      else if (randPref < 0.85) sexual_preference = 'homosexual';
      else sexual_preference = 'bisexual';

      const birthdate = faker.date.birthdate({ min: 18, max: 60, mode: 'age' });
      const age = new Date().getFullYear() - birthdate.getFullYear();
      const biography = faker.lorem.paragraph().substring(0, 200);
      const fameRating = faker.number.int({ min: 0, max: 500 });

      const userRes = await pool.query(
        `INSERT INTO users (
           email, username, firstname, lastname, password,
           verified, gender, sexual_preference, birthdate, biography,
           fame_rating, latitude, longitude, profile_complete
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING id`,
        [
          email,
          username,
          firstname,
          lastname,
          hashedPassword,
          true,
          gender,
          sexual_preference,
          birthdate,
          biography,
          fameRating,
          latitude,
          longitude,
          true,
        ],
      );
      const userId = userRes.rows[0].id;

      const csvRow = `${userId},${email},${username},${password},${firstname},${lastname},${gender},${sexual_preference},${age},${fameRating},${latitude.toFixed(
        4,
      )},${longitude.toFixed(4)}\n`;
      fs.appendFileSync(CSV_FILE, csvRow);

      const shuffledTags = [...tagIds].sort(() => 0.5 - Math.random());
      const selectedTags = shuffledTags.slice(0, Math.floor(Math.random() * 4) + 1);

      for (const tag of selectedTags) {
        await pool.query('INSERT INTO user_tags (user_id, tag_id) VALUES ($1, $2)', [userId, tag.id]);
      }

      const numImages = Math.floor(Math.random() * 5) + 1;
      for (let j = 0; j < numImages; j++) {
        const isProfile = j === 0;
        const imgId = Math.floor(Math.random() * 79);
        const imageUrl = `https://xsgames.co/randomusers/assets/avatars/${sex}/${imgId}.jpg`;

        await pool.query(`INSERT INTO user_images (user_id, file_path, is_profile_picture) VALUES ($1, $2, $3)`, [
          userId,
          imageUrl,
          isProfile,
        ]);
      }

      process.stdout.write('.');
    }

    console.log('\n📊 Creating likes and interactions...');

    const allUsersResult = await pool.query('SELECT id, gender, sexual_preference FROM users ORDER BY id');
    const users = allUsersResult.rows;
    const userIds = users.map((row) => row.id);
    const usersMap = new Map(users.map((u) => [u.id, u]));

    // Check if a user is interested in a specific gender
    const isInterestedIn = (user, targetGender) => {
      if (user.sexual_preference === 'bisexual') return true;
      if (user.sexual_preference === 'heterosexual') {
        return user.gender !== targetGender;
      }
      if (user.sexual_preference === 'homosexual') {
        return user.gender === targetGender;
      }
      return false;
    };

    // Check if two users can match based on sexual preferences
    const canLike = (liker, liked) => {
      return isInterestedIn(liker, liked.gender) && isInterestedIn(liked, liker.gender);
    };

    const likesToCreate = Math.floor((userIds.length * userIds.length * 0.3) / 2);
    const createdLikes = new Set();
    let attempts = 0;
    const maxAttempts = likesToCreate * 10;

    while (createdLikes.size < likesToCreate && attempts < maxAttempts) {
      attempts++;
      const likerId = userIds[Math.floor(Math.random() * userIds.length)];
      const likedId = userIds[Math.floor(Math.random() * userIds.length)];

      if (likerId === likedId || createdLikes.has(`${likerId}-${likedId}`)) continue;

      const liker = usersMap.get(likerId);
      const liked = usersMap.get(likedId);

      if (!canLike(liker, liked)) continue;

      try {
        await pool.query('INSERT INTO likes (liker_id, liked_id) VALUES ($1, $2)', [likerId, likedId]);
        createdLikes.add(`${likerId}-${likedId}`);
      } catch (err) {}
    }

    // Create mutual matches (both users like each other) respecting preferences
    const matchesToCreate = Math.floor(userIds.length * 0.1);
    let matchesCreated = 0;
    attempts = 0;

    while (matchesCreated < matchesToCreate && attempts < matchesToCreate * 10) {
      attempts++;
      const user1Id = userIds[Math.floor(Math.random() * userIds.length)];
      const user2Id = userIds[Math.floor(Math.random() * userIds.length)];

      if (user1Id === user2Id) continue;

      const user1 = usersMap.get(user1Id);
      const user2 = usersMap.get(user2Id);

      if (!canLike(user1, user2)) continue;

      try {
        await pool.query('INSERT INTO likes (liker_id, liked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
          user1Id,
          user2Id,
        ]);
        await pool.query('INSERT INTO likes (liker_id, liked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
          user2Id,
          user1Id,
        ]);
        matchesCreated++;
      } catch (err) {}
    }

    console.log(`✅ Created ${createdLikes.size} likes and ${matchesCreated} mutual matches`);

    const viewsToCreate = Math.floor((userIds.length * userIds.length * 0.4) / 2);
    const createdViews = new Set();
    attempts = 0;
    const maxViewAttempts = viewsToCreate * 10;

    while (createdViews.size < viewsToCreate && attempts < maxViewAttempts) {
      attempts++;
      const viewerId = userIds[Math.floor(Math.random() * userIds.length)];
      const viewedId = userIds[Math.floor(Math.random() * userIds.length)];

      if (viewerId === viewedId || createdViews.has(`${viewerId}-${viewedId}`)) continue;

      const viewer = usersMap.get(viewerId);
      const viewed = usersMap.get(viewedId);

      // Only create view if viewer is interested in viewed's gender
      if (!isInterestedIn(viewer, viewed.gender)) continue;

      try {
        await pool.query('INSERT INTO profile_views (viewer_id, viewed_id) VALUES ($1, $2)', [viewerId, viewedId]);
        createdViews.add(`${viewerId}-${viewedId}`);
      } catch (err) {}
    }

    console.log(`✅ Created ${createdViews.size} profile views`);

    const blocksToCreate = Math.floor(userIds.length * 0.02);
    for (let i = 0; i < blocksToCreate; i++) {
      const blockerId = userIds[Math.floor(Math.random() * userIds.length)];
      const blockedId = userIds[Math.floor(Math.random() * userIds.length)];

      if (blockerId !== blockedId) {
        try {
          await pool.query('INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
            blockerId,
            blockedId,
          ]);
        } catch (err) {}
      }
    }

    console.log(`✅ Created ${blocksToCreate} blocks`);

    console.log('📈 Updating fame ratings...');
    await pool.query(`
      UPDATE users
      SET fame_rating = (
        SELECT COALESCE(
          (SELECT COUNT(*) * 5 FROM likes WHERE liked_id = users.id) +
          (SELECT COUNT(*) FROM profile_views WHERE viewed_id = users.id) +
          (SELECT COUNT(*) * 2 FROM user_images WHERE user_id = users.id) +
          CASE WHEN profile_complete THEN 10 ELSE 0 END,
          0
        )
      )
    `);

    console.log(`\n✅ Seed completed successfully!`);
    console.log(`📄 User data and specs saved to ${CSV_FILE}`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error during seed:', err);
    process.exit(1);
  }
};

seed();
