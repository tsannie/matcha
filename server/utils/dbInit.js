import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';
import { seed } from '../seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runDatabaseMigration = async () => {
  try {
    const sqlPath = path.join(__dirname, '..', 'db', 'init.sql');

    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);
    console.log('✅ Database tables checked/created successfully from init.sql');

    const { rows } = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(rows[0].count) === 0) {
      console.log('🌱 Database is empty, seeding 500 users...');
      await seed();
    }
  } catch (error) {
    console.error('❌ Error executing database migration:', error);
  }
};
