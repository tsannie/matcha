import { faker } from '@faker-js/faker';
import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

if (!process.env.DB_PASSWORD) {
  console.error('❌ Erreur: DB_PASSWORD est introuvable. Vérifie ton fichier .env');
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

const USERS_TO_CREATE = 50;
const PARIS_LAT = 48.8566;
const PARIS_LON = 2.3522;

const TAGS_LIST = [
  'Vegan',
  'Geek',
  'Gym',
  'Photography',
  'Travel',
  'Foodie',
  'Music',
  'Art',
  'Tech',
  'Nature',
  'Cinema',
  'CatLover',
  'DogLover',
  'Hiking',
  'Coding',
];

const seed = async () => {
  try {
    console.log('🌱 Starting seed...');
    console.log(`Connecting to database: ${process.env.DB_NAME} as ${process.env.DB_USER}`);

    await pool.query('TRUNCATE notifications, blocks, reports, profile_views, likes, user_images, user_tags, tags, users RESTART IDENTITY CASCADE');

    const tagIds = [];
    for (const tagName of TAGS_LIST) {
      const res = await pool.query('INSERT INTO tags (name) VALUES ($1) RETURNING id', [tagName]);
      tagIds.push({ id: res.rows[0].id, name: tagName });
    }

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    for (let i = 0; i < USERS_TO_CREATE; i++) {
      // Sexe déterminé (male/female)
      const sex = faker.person.sexType();
      const firstname = faker.person.firstName(sex);
      const lastname = faker.person.lastName();
      const username = (firstname + lastname + i).toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = faker.internet.email({ firstName: firstname, lastName: lastname + i });

      const latitude = PARIS_LAT + (Math.random() - 0.5) * 0.5;
      const longitude = PARIS_LON + (Math.random() - 0.5) * 0.5;

      const gender = sex;
      let sexual_preference;
      const randPref = Math.random();

      if (randPref < 0.7) sexual_preference = 'heterosexual';
      else if (randPref < 0.85) sexual_preference = 'homosexual';
      else sexual_preference = 'bisexual';

      const birthdate = faker.date.birthdate({ min: 18, max: 60, mode: 'age' });
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
        ]
      );
      const userId = userRes.rows[0].id;

      const shuffledTags = [...tagIds].sort(() => 0.5 - Math.random());
      const selectedTags = shuffledTags.slice(0, Math.floor(Math.random() * 4) + 1);

      for (const tag of selectedTags) {
        await pool.query('INSERT INTO user_tags (user_id, tag_id) VALUES ($1, $2)', [userId, tag.id]);
      }

      const numImages = Math.floor(Math.random() * 5) + 1;
      for (let j = 0; j < numImages; j++) {
        const isProfile = j === 0;

        // MODIFICATION ICI : Utilisation de xsgames avec le bon genre
        // On ajoute un paramètre bidon &key=${j} pour que l'URL soit unique
        // et que le navigateur ne mette pas en cache la même image pour tout le monde.
        const imageUrl = `https://xsgames.co/randomusers/avatar.php?g=${sex}&key=${userId}-${j}`;

        await pool.query(`INSERT INTO user_images (user_id, file_path, is_profile_picture) VALUES ($1, $2, $3)`, [
          userId,
          imageUrl,
          isProfile,
        ]);
      }

      process.stdout.write('.');
    }

    console.log('\n📊 Creating likes and interactions...');

    // Get all user IDs
    const allUsersResult = await pool.query('SELECT id FROM users ORDER BY id');
    const userIds = allUsersResult.rows.map((row) => row.id);

    // Generate random likes (about 30% of possible combinations)
    const likesToCreate = Math.floor((userIds.length * userIds.length * 0.3) / 2);
    const createdLikes = new Set();

    for (let i = 0; i < likesToCreate; i++) {
      const likerId = userIds[Math.floor(Math.random() * userIds.length)];
      const likedId = userIds[Math.floor(Math.random() * userIds.length)];

      // Avoid self-likes and duplicates
      if (likerId !== likedId && !createdLikes.has(`${likerId}-${likedId}`)) {
        try {
          await pool.query('INSERT INTO likes (liker_id, liked_id) VALUES ($1, $2)', [likerId, likedId]);
          createdLikes.add(`${likerId}-${likedId}`);
        } catch (err) {
          // Ignore duplicate errors
        }
      }
    }

    // Create some mutual matches (about 10% of users)
    const matchesToCreate = Math.floor(userIds.length * 0.1);
    for (let i = 0; i < matchesToCreate; i++) {
      const user1 = userIds[Math.floor(Math.random() * userIds.length)];
      const user2 = userIds[Math.floor(Math.random() * userIds.length)];

      if (user1 !== user2) {
        try {
          await pool.query('INSERT INTO likes (liker_id, liked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
            user1,
            user2,
          ]);
          await pool.query('INSERT INTO likes (liker_id, liked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
            user2,
            user1,
          ]);
        } catch (err) {
          // Ignore errors
        }
      }
    }

    console.log(`✅ Created ${createdLikes.size} likes and ~${matchesToCreate} mutual matches`);

    // Generate random profile views (about 40% of possible combinations)
    const viewsToCreate = Math.floor((userIds.length * userIds.length * 0.4) / 2);
    const createdViews = new Set();

    for (let i = 0; i < viewsToCreate; i++) {
      const viewerId = userIds[Math.floor(Math.random() * userIds.length)];
      const viewedId = userIds[Math.floor(Math.random() * userIds.length)];

      if (viewerId !== viewedId && !createdViews.has(`${viewerId}-${viewedId}`)) {
        try {
          await pool.query('INSERT INTO profile_views (viewer_id, viewed_id) VALUES ($1, $2)', [viewerId, viewedId]);
          createdViews.add(`${viewerId}-${viewedId}`);
        } catch (err) {
          // Ignore duplicate errors
        }
      }
    }

    console.log(`✅ Created ${createdViews.size} profile views`);

    // Generate a few random blocks (about 2% of users)
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
        } catch (err) {
          // Ignore errors
        }
      }
    }

    console.log(`✅ Created ${blocksToCreate} blocks`);

    // Update fame ratings based on likes and views
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

    console.log(`\n✅ Seed terminé avec succès ! ${USERS_TO_CREATE} utilisateurs créés avec interactions.`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erreur pendant le seed:', err);
    process.exit(1);
  }
};

seed();
