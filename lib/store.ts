import { promises as fs } from 'fs';
import path from 'path';

// A tiny JSON-file "database". Fine for a personal site on a server with a
// persistent disk. To move to Postgres/SQLite later, only this file changes.

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
const SEED_FILE = path.join(process.cwd(), 'data', 'seed.json');

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
      const fresh = JSON.parse(await fs.readFile(SEED_FILE, 'utf8')) as DB;
      await write(fresh);
      return fresh;
    }
  })().finally(() => { seeding = null; });
  return seeding;
}

// databases created by older versions miss newer collections
function normalize(db: DB): DB {
  db.certifications ??= [];
  return db;
}

async function load(): Promise<DB> {
  try {
    return normalize(JSON.parse(await fs.readFile(DB_FILE, 'utf8')) as DB);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    return seed();
  }
}

export function getDB(): Promise<DB> {
  return load();
}

/** Serialised read-modify-write so concurrent requests never clobber each other. */
export function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await load();
    const result = await fn(db);
    await write(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}
