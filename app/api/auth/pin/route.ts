import { fail, guard, json, readJson } from '@/lib/api';
import { PIN_PATTERN, clientIp, rateLimit, setPin, verifyPin } from '@/lib/auth';

// Change the admin PIN. Requires a valid session AND the current PIN.
export async function PATCH(req: Request) {
  const denied = await guard(req, { write: true });
  if (denied) return denied;

  const limit = rateLimit(`pin:${clientIp(req)}`, 10, 15 * 60 * 1000);
  if (!limit.ok) return fail(429, 'Too many attempts. Try again later.');

  const body = (await readJson(req)) as { current?: unknown; next?: unknown } | null;
  const current = typeof body?.current === 'string' ? body.current : '';
  const next = typeof body?.next === 'string' ? body.next : '';

  if (!PIN_PATTERN.test(next)) return fail(400, 'The new PIN must be 4 to 8 digits.');
  if (!PIN_PATTERN.test(current) || !(await verifyPin(current))) return fail(401, 'Current PIN is wrong.');

  await setPin(next);
  return json({ ok: true });
}
