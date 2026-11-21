import { neon } from '@neondatabase/serverless';

// Neon over HTTP: works in serverless functions with no connection pooling to manage.
export function sql() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error('DATABASE_URL is not set.');
  return neon(url);
}

let ready: Promise<void> | null = null;

/** Creates the two tables on first use (once per server instance). */
export function ensureSchema(): Promise<void> {
  ready ??= (async () => {
    const q = sql();
    await q`CREATE TABLE IF NOT EXISTS kv (key text PRIMARY KEY, value jsonb NOT NULL, version integer NOT NULL DEFAULT 1)`;
    await q`CREATE TABLE IF NOT EXISTS uploads (name text PRIMARY KEY, content_type text NOT NULL, data bytea NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`;
  })().catch((e) => { ready = null; throw e; });
  return ready;
}
