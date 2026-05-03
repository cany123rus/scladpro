import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/scladstats';

export const pool = new Pool({ connectionString });

export async function query(text, params = []) {
  const res = await pool.query(text, params);
  return res;
}
