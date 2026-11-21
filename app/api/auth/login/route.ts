import { fail, json, readJson, sameOrigin } from '@/lib/api';
import { PIN_PATTERN, clearRateLimit, clientIp, isSecureRequest, makeToken, rateLimit, sessionCookie, verifyPin } from '@/lib/auth';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, 'Cross-origin request blocked.');

  const key = `login:${clientIp(req)}`;
  const limit = rateLimit(key, 5, 15 * 60 * 1000);
  if (!limit.ok) {
    return fail(429, `Too many attempts. Try again in ${Math.ceil(limit.retryAfter / 60)} min.`, { 'Retry-After': String(limit.retryAfter) });
  }

  const body = (await readJson(req)) as { pin?: unknown } | null;
  const pin = typeof body?.pin === 'string' ? body.pin : '';
  const ok = PIN_PATTERN.test(pin) && (await verifyPin(pin));
  if (!ok) {
    await new Promise((r) => setTimeout(r, 500)); // slow down guessing
    return fail(401, 'Wrong PIN.');
  }

  clearRateLimit(key);
  const res = json({ ok: true });
  res.cookies.set(sessionCookie(makeToken(), isSecureRequest(req)));
  return res;
}
