import { neon } from '@neondatabase/serverless';

let client;
let ready;
export function db() {
  if (!process.env.DATABASE_URL) throw new Error('Vercel needs a Postgres DATABASE_URL. Add the Neon storage integration first.');
  return client ||= neon(process.env.DATABASE_URL);
}
export async function ensureSchema() {
  if (!ready) ready = (async () => {
    const sql = db();
    await sql`CREATE TABLE IF NOT EXISTS daymark_users (
      id text PRIMARY KEY, name text NOT NULL UNIQUE, salt text NOT NULL,
      password_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS daymark_registration_lock (
      singleton integer PRIMARY KEY CHECK (singleton=1), claimed_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS daymark_sessions (
      token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES daymark_users(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS daymark_sessions_expiry_idx ON daymark_sessions(expires_at)`;
    await sql`CREATE TABLE IF NOT EXISTS daymark_state (
      user_id text PRIMARY KEY REFERENCES daymark_users(id) ON DELETE CASCADE,
      payload jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS daymark_login_limits (
      key text PRIMARY KEY, failures integer NOT NULL DEFAULT 0, locked_until timestamptz,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
  })().catch(e => { ready = undefined; throw e; });
  await ready;
  return db();
}
export const emptyState = () => ({ tasks: [], journals: {}, sleep: {}, recovery: [], ledger: [], settings: { recoveryMode: 'normal' }, reminders: {} });
export async function readUser(request) {
  const raw = (request.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('sid='))?.slice(4);
  if (!raw) return null;
  const tokenHash = (await import('node:crypto')).createHash('sha256').update(raw).digest('hex');
  const sql = await ensureSchema();
  const rows = await sql`SELECT u.id, u.name FROM daymark_sessions s JOIN daymark_users u ON u.id=s.user_id WHERE s.token_hash=${tokenHash} AND s.expires_at>now()`;
  return rows[0] || null;
}
export function reply(response, status=200, body={}, headers={}) {
  response.statusCode = status;
  for (const [k,v] of Object.entries(headers)) response.setHeader(k,v);
  response.setHeader('Cache-Control','no-store');
  response.setHeader('Content-Type','application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}
export async function parseBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  let raw=''; for await (const chunk of request) { raw+=chunk; if(raw.length>1_000_000) throw new Error('Request is too large.'); }
  return raw ? JSON.parse(raw) : {};
}
