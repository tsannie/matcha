import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runDatabaseMigration = async () => {
  try {
    const sqlPath = path.join(__dirname, '..', 'db', 'init.sql');

    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);
    console.log('✅ Database tables checked/created successfully from init.sql');
  } catch (error) {
    console.error('❌ Error executing database migration:', error);
  }
};
