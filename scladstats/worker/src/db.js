import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/scladstats';
export const pool = new Pool({ connectionString });

export async function getSyncCursor(accountId, source) {
  const q = await pool.query(
    'select cursor_value from sync_state where account_id = $1 and source = $2',
    [accountId, source]
  );
  return q.rows[0]?.cursor_value || null;
}

export async function setSyncCursor(accountId, source, cursorValue) {
  await pool.query(
    `insert into sync_state(account_id, source, cursor_value)
     values ($1,$2,$3)
     on conflict (account_id, source)
     do update set cursor_value = excluded.cursor_value, updated_at = now()`,
    [accountId, source, cursorValue]
  );
}
