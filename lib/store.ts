import { promises as fs } from 'fs';
import path from 'path';
import { getStore } from '@netlify/blobs';
import { sql, ensureSchema } from '@/lib/neon';
import seedJson from '@/data/seed.json';

// A tiny "database" with two backends, chosen automatically:
//  - Postgres (Neon) when DATABASE_URL / POSTGRES_URL is set  (Vercel + Neon)
//  - Netlify Blobs when running on Netlify                     (serverless: no writable disk)
//  - a JSON file (data/db.json) everywhere else                (local dev, VPS, Railway/Fly with a volume)
// Force one with STORAGE=neon | blobs | file. Only this file, lib/neon.ts and lib/files.ts touch storage.

export interface Item {
  id: string;
  [key: string]: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
  emailed?: boolean;
}

export interface DB {
  profile: Record<string, string>;
  posts: Item[];
  templates: Item[];
  projects: Item[];
  skills: Item[];
  experience: Item[];
  education: Item[];
  certifications: Item[];
  messages: Message[];
  settings: { pinHash?: string };
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SEED = seedJson as unknown as DB; // bundled, so it also exists inside serverless functions

export type Backend = 'neon' | 'blobs' | 'file';

export function backend(): Backend {
  const forced = process.env.STORAGE;
  if (forced === 'neon' || forced === 'blobs' || forced === 'file') return forced;
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) return 'neon';
  if (process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT) return 'blobs';
  return 'file';
}

// databases created by older versions miss newer collections
function normalize(db: DB): DB {
  db.certifications ??= [];
  db.messages ??= [];
  db.settings ??= {};
  return db;
}

const fresh = (): DB => normalize(JSON.parse(JSON.stringify(SEED)) as DB);

/* ------------------------------ Netlify Blobs ------------------------------ */
const SITE_ID = 'ac935cc7-a09b-4371-ba6d-ce1d309f2e35';


const blobStore = () =>
  getStore({
    name: 'portfolio',
    consistency: 'strong',
    siteID: SITE_ID,
    token: process.env.BLOBS_TOKEN?.trim(),
  });
async function blobMutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const store = blobStore();
  // optimistic concurrency: serverless instances can't share an in-memory queue, so
  // write only if nobody changed the document since we read it, otherwise retry.
  for (let attempt = 0; attempt < 8; attempt++) {
    const cur = await store.getWithMetadata('db', { type: 'json' });
    const db = cur ? normalize(cur.data as DB) : fresh();
    const result = await fn(db);
    const res = cur
      ? await store.setJSON('db', db, { onlyIfMatch: cur.etag })
      : await store.setJSON('db', db, { onlyIfNew: true });
    if (res.modified) return result;
    await new Promise((r) => setTimeout(r, 40 + Math.random() * 120));
  }
  throw new Error('Could not save: too many simultaneous edits. Please try again.');
}

async function blobLoad(): Promise<DB> {
  const data = (await blobStore().get('db', { type: 'json' })) as DB | null;
  return data ? normalize(data) : fresh(); // not saved yet: show the seed content
}

/* --------------------------- Postgres (Neon) --------------------------- */
// The whole site is one JSON document in one row, versioned for optimistic concurrency.

async function neonRead(): Promise<{ db: DB; version: number } | null> {
  await ensureSchema();
  const rows = (await sql()`SELECT value, version FROM kv WHERE key = 'db'`) as { value: DB; version: number }[];
  return rows[0] ? { db: normalize(rows[0].value), version: Number(rows[0].version) } : null;
}

async function neonLoad(): Promise<DB> {
  return (await neonRead())?.db ?? fresh(); // nothing saved yet: show the seed content
}

async function neonMutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const cur = await neonRead();
    const db = cur?.db ?? fresh();
    const result = await fn(db);
    const json = JSON.stringify(db);
    const rows = cur
      ? await sql()`UPDATE kv SET value = ${json}::jsonb, version = version + 1 WHERE key = 'db' AND version = ${cur.version} RETURNING version`
      : await sql()`INSERT INTO kv (key, value, version) VALUES ('db', ${json}::jsonb, 1) ON CONFLICT (key) DO NOTHING RETURNING version`;
    if (rows.length) return result; // nobody changed it in between
    await new Promise((r) => setTimeout(r, 40 + Math.random() * 120));
  }
  throw new Error('Could not save: too many simultaneous edits. Please try again.');
}

/* -------------------------------- JSON file -------------------------------- */

let queue: Promise<unknown> = Promise.resolve();
let seeding: Promise<DB> | null = null;

async function write(db: DB) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  // unique temp name per write so simultaneous writers can never rename each other's file
  const tmp = `${DB_FILE}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), 'utf8');
  await fs.rename(tmp, DB_FILE); // atomic replace
}

// First run only: many requests can arrive at once, so create the file exactly once.
function seed(): Promise<DB> {
  seeding ??= (async () => {
    try {
      return JSON.parse(await fs.readFile(DB_FILE, 'utf8')) as DB; // someone else already created it
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
      const db = fresh();
      await write(db);
      return db;
    }
  })().finally(() => { seeding = null; });
  return seeding;
}

async function fileLoad(): Promise<DB> {
  try {
    return normalize(JSON.parse(await fs.readFile(DB_FILE, 'utf8')) as DB);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    return seed();
  }
}

/* ---------------------------------- API ---------------------------------- */

export function getDB(): Promise<DB> {
  const b = backend();
  return b === 'neon' ? neonLoad() : b === 'blobs' ? blobLoad() : fileLoad();
}

/** Serialised read-modify-write so concurrent requests never clobber each other. */
export function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const b = backend();
  if (b === 'neon') return neonMutate(fn);
  if (b === 'blobs') return blobMutate(fn);
  const run = queue.then(async () => {
    const db = await fileLoad();
    const result = await fn(db);
    await write(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}
