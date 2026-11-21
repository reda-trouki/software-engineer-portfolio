import { promises as fs } from 'fs';
import path from 'path';
import { getStore } from '@netlify/blobs';
import { useBlobs } from '@/lib/store';

// Uploaded images: Netlify Blobs on Netlify, the data/uploads folder everywhere else.
const DIR = path.join(process.env.DATA_DIR || path.join(process.cwd(), 'data'), 'uploads');
const store = () => getStore({ name: 'uploads', consistency: 'strong' });

export async function saveFile(name: string, buf: Buffer, contentType: string): Promise<void> {
  if (useBlobs()) {
    await store().set(name, new Uint8Array(buf).buffer as ArrayBuffer, { metadata: { contentType } });
    return;
  }
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, name), buf);
}

export async function readFile(name: string): Promise<Uint8Array | null> {
  if (useBlobs()) {
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
  if (useBlobs()) {
    const { blobs } = await store().list({ prefix });
    await Promise.all(blobs.filter((b) => b.key !== keep).map((b) => store().delete(b.key).catch(() => undefined)));
    return;
  }
  try {
    for (const f of await fs.readdir(DIR)) if (f !== keep && f.startsWith(prefix)) await fs.unlink(path.join(DIR, f)).catch(() => undefined);
  } catch { /* no uploads folder yet */ }
}
