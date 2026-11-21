import { promises as fs } from 'fs';
import path from 'path';
import { getStore } from '@netlify/blobs';
import { backend } from '@/lib/store';
import { sql, ensureSchema } from '@/lib/neon';

// Uploaded images: Postgres (Neon), Netlify Blobs, or the data/uploads folder, same choice as lib/store.ts.
const DIR = path.join(process.env.DATA_DIR || path.join(process.cwd(), 'data'), 'uploads');
const store = () => getStore({ name: 'uploads', consistency: 'strong' });

export async function saveFile(name: string, buf: Buffer, contentType: string): Promise<void> {
  if (backend() === 'neon') {
    await ensureSchema();
    await sql()`INSERT INTO uploads (name, content_type, data) VALUES (${name}, ${contentType}, decode(${buf.toString('base64')}, 'base64')) ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data, content_type = EXCLUDED.content_type`;
    return;
  }
  if (backend() === 'blobs') {
    await store().set(name, new Uint8Array(buf).buffer as ArrayBuffer, { metadata: { contentType } });
    return;
  }
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, name), buf);
}

export async function readFile(name: string): Promise<Uint8Array | null> {
  if (backend() === 'neon') {
    await ensureSchema();
    const rows = (await sql()`SELECT encode(data, 'base64') AS b64 FROM uploads WHERE name = ${name}`) as { b64: string }[];
    return rows[0] ? new Uint8Array(Buffer.from(rows[0].b64, 'base64')) : null;
  }
  if (backend() === 'blobs') {
    const data = await store().get(name, { type: 'arrayBuffer' });
    return data ? new Uint8Array(data) : null;
  }
  try {
    return new Uint8Array(await fs.readFile(path.join(DIR, name)));
  } catch {
    return null;
  }
}

/** Deletes every upload starting with `prefix`, except the file named `keep`. */
export async function removeByPrefix(prefix: string, keep: string): Promise<void> {
  if (backend() === 'neon') {
    await ensureSchema();
    await sql()`DELETE FROM uploads WHERE name LIKE ${prefix + '%'} AND name <> ${keep}`;
    return;
  }
  if (backend() === 'blobs') {
    const { blobs } = await store().list({ prefix });
    await Promise.all(blobs.filter((b) => b.key !== keep).map((b) => store().delete(b.key).catch(() => undefined)));
    return;
  }
  try {
    for (const f of await fs.readdir(DIR)) if (f !== keep && f.startsWith(prefix)) await fs.unlink(path.join(DIR, f)).catch(() => undefined);
  } catch { /* no uploads folder yet */ }
}
