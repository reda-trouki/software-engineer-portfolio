import { fail, guard, json, readJson } from '@/lib/api';
import { PROFILE_FIELDS, validate } from '@/lib/collections';
import { getDB, mutate } from '@/lib/store';

export async function GET() {
  const db = await getDB();
  return json(db.profile);
}

export async function PUT(req: Request) {
  const denied = await guard(req, { write: true });
  if (denied) return denied;

  const result = validate(PROFILE_FIELDS, await readJson(req));
  if ('error' in result) return fail(400, result.error);

  const profile = await mutate((db) => {
    db.profile = { ...db.profile, ...result.data };
    return db.profile;
  });
  return json(profile);
}
