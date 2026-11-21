import { fail, guard, json, readJson } from '@/lib/api';
import { COLLECTIONS, isCollectionKey, validate } from '@/lib/collections';
import { mutate } from '@/lib/store';

type Ctx = { params: Promise<{ collection: string; id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const denied = await guard(req, { write: true });
  if (denied) return denied;

  const { collection, id } = await params;
  if (!isCollectionKey(collection)) return fail(404, 'Unknown collection.');

  const result = validate(COLLECTIONS[collection].fields, await readJson(req));
  if ('error' in result) return fail(400, result.error);

  const updated = await mutate((db) => {
    const index = db[collection].findIndex((x) => x.id === id);
    if (index === -1) return null;
    // keep id, slug and date; only validated fields can change
    db[collection][index] = { ...db[collection][index], ...result.data };
    return db[collection][index];
  });

  return updated ? json(updated) : fail(404, 'Not found.');
}

export async function DELETE(req: Request, { params }: Ctx) {
  const denied = await guard(req, { write: true });
  if (denied) return denied;

  const { collection, id } = await params;
  if (!isCollectionKey(collection)) return fail(404, 'Unknown collection.');

  const removed = await mutate((db) => {
    const before = db[collection].length;
    db[collection] = db[collection].filter((x) => x.id !== id);
    return db[collection].length < before;
  });

  return removed ? json({ ok: true }) : fail(404, 'Not found.');
}
