import crypto from 'crypto';
import { fail, guard, json, readJson } from '@/lib/api';
import { isAuthed } from '@/lib/auth';
import { COLLECTIONS, isCollectionKey, validate } from '@/lib/collections';
import { slugify } from '@/lib/format';
import { getDB, mutate, type Item } from '@/lib/store';

type Ctx = { params: Promise<{ collection: string }> };

// GET /api/posts | templates | projects | skills | experience | education
// Public callers only ever see published posts; the owner sees everything.
export async function GET(_req: Request, { params }: Ctx) {
  const { collection } = await params;
  if (!isCollectionKey(collection)) return fail(404, 'Unknown collection.');
  const db = await getDB();
  let items = db[collection];
  if (collection === 'posts' && !(await isAuthed())) items = items.filter((p) => p.status === 'Published');
  return json(items);
}

export async function POST(req: Request, { params }: Ctx) {
  const denied = await guard(req, { write: true });
  if (denied) return denied;

  const { collection } = await params;
  if (!isCollectionKey(collection)) return fail(404, 'Unknown collection.');
  const def = COLLECTIONS[collection];

  const result = validate(def.fields, await readJson(req));
  if ('error' in result) return fail(400, result.error);

  const item = await mutate((db) => {
    const created: Item = { id: crypto.randomUUID(), ...result.data };
    if (collection === 'posts') {
      const base = slugify(result.data.title);
      let slug = base;
      for (let n = 2; db.posts.some((p) => p.slug === slug); n++) slug = `${base}-${n}`;
      created.slug = slug;
      created.date = new Date().toISOString();
    }
    if (def.prepend) db[collection].unshift(created);
    else db[collection].push(created);
    return created;
  });

  return json(item, { status: 201 });
}
