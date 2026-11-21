import { NextResponse } from 'next/server';
import { isAuthed } from './auth';

export const json = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);
export const fail = (status: number, message: string, headers?: HeadersInit) =>
  NextResponse.json({ error: message }, { status, headers });

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/** Blocks cross-site form posts (defence in depth on top of SameSite=Strict). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.get('host');
  } catch {
    return false;
  }
}

/** Returns an error response if the request may not proceed, otherwise null. */
export async function guard(req: Request, opts: { write?: boolean } = {}) {
  if (opts.write && !sameOrigin(req)) return fail(403, 'Cross-origin request blocked.');
  if (!(await isAuthed())) return fail(401, 'Not signed in.');
  return null;
}
