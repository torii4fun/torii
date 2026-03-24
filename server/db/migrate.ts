import { readFileSync } from 'fs';
import { resolve } from 'path';
import { pool } from './client';
import 'dotenv/config';

async function migrate() {
  // Drop view first — CREATE OR REPLACE cannot remove columns
  await pool.query(`DROP VIEW IF EXISTS v_clan_leaderboard`);

  const sql = readFileSync(resolve(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('✅ Schema applied');
  await pool.end();
}

migrate().catch(e => { console.error(e); process.exit(1); });
