import { promises as fs } from 'fs';
import path from 'path';
import { getStore } from '@netlify/blobs';
import seedJson from '@/data/seed.json';

// A tiny "database" with two backends, chosen automatically:
//  - Netlify Blobs when running on Netlify (serverless: no writable disk)
//  - a JSON file (data/db.json) everywhere else (local dev, VPS, Railway/Fly with a volume)
// Force one with STORAGE=blobs or STORAGE=file. Only this file and lib/files.ts touch storage.

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

export const useBlobs = (): boolean =>
  process.env.STORAGE === 'blobs' ||
  (process.env.STORAGE !== 'file' && (!!process.env.NETLIFY || !!process.env.NETLIFY_BLOBS_CONTEXT));

// databases created by older versions miss newer collections
function normalize(db: DB): DB {
  db.certifications ??= [];
  db.messages ??= [];
  db.settings ??= {};
  return db;
}

const fresh = (): DB => normalize(JSON.parse(JSON.stringify(SEED)) as DB);

/* ------------------------------ Netlify Blobs ------------------------------ */

const withTimeout = <T,>(p: Promise<T>, ms = 4000): Promise<T> =>
  Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Blobs timeout')), ms)),
  ]);

// Explicit credentials: the automatic setup does not work on this site.
const blobStore = () =>
  getStore({
    name: 'portfolio',
    consistency: 'strong',
    siteID: process.env.BLOBS_SITE_ID?.trim(),
    token: process.env.BLOBS_TOKEN?.trim(),
  });

// Check existence with list() instead of get(): get() on a missing key hangs here.
async function blobHas(store: ReturnType<typeof blobStore>): Promise<boolean> {
  const { blobs } = await withTimeout(store.list({ prefix: 'db' }));
  return blobs.some((b) => b.key === 'db');
}

async function blobMutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const store = blobStore();
  // optimistic concurrency: serverless instances can't share an in-memory queue, so
  // write only if nobody changed the document since we read it, otherwise retry.
  for (let attempt = 0; attempt < 8; attempt++) {
    const exists = await blobHas(store);
    const cur = exists ? await withTimeout(store.getWithMetadata('db', { type: 'json' })) : null;
    const db = cur ? normalize(cur.data as DB) : fresh();
    const result = await fn(db);
    const res = cur
      ? await withTimeout(store.setJSON('db', db, { onlyIfMatch: cur.etag }))
      : await withTimeout(store.setJSON('db', db, { onlyIfNew: true }));
    if (res.modified) return result;
    await new Promise((r) => setTimeout(r, 40 + Math.random() * 120));
  }
  throw new Error('Could not save: too many simultaneous edits. Please try again.');
}

async function blobLoad(): Promise<DB> {
  const store = blobStore();
  try {
    if (!(await blobHas(store))) return fresh(); // nothing saved yet: show the seed content
    const data = (await withTimeout(store.get('db', { type: 'json' }))) as DB | null;
    return data ? normalize(data) : fresh();
  } catch {
    return fresh(); // never let a storage problem hang or crash the public pages
  }
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
  })().finally(() => {
    seeding = null;
  });
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
  return useBlobs() ? blobLoad() : fileLoad();
}

/** Serialised read-modify-write so concurrent requests never clobber each other. */
export function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  if (useBlobs()) return blobMutate(fn);
  const run = queue.then(async () => {
    const db = await fileLoad();
    const result = await fn(db);
    await write(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}