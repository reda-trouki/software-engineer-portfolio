import { fail, json, sameOrigin } from '@/lib/api';
import { clearedCookie, isSecureRequest } from '@/lib/auth';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, 'Cross-origin request blocked.');
  const res = json({ ok: true });
  res.cookies.set(clearedCookie(isSecureRequest(req)));
  return res;
}
