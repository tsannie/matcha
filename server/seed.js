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

    await pool.query('TRUNCATE user_images, user_tags, tags, users RESTART IDENTITY CASCADE');

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

      if (randPref < 0.7) sexual_preference = gender === 'male' ? 'female' : 'male';
      else if (randPref < 0.85) sexual_preference = gender;
      else sexual_preference = 'both';

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

    console.log(`\n✅ Seed terminé avec succès ! ${USERS_TO_CREATE} utilisateurs créés.`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erreur pendant le seed:', err);
    process.exit(1);
  }
};

seed();
