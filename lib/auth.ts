import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getDB, mutate } from './store';

const COOKIE = 'admin_session';
const TTL_SECONDS = 8 * 60 * 60;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET must be set in production.');
  return 'dev-only-secret-change-me';
}

const sign = (payload: string) => crypto.createHmac('sha256', secret()).update(payload).digest('base64url');

export function makeToken(): string {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token?: string): boolean {
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof exp === 'number' && exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export async function isAuthed(): Promise<boolean> {
  const jar = await cookies();
  return verifyToken(jar.get(COOKIE)?.value);
}

export const sessionCookie = (token: string, secure: boolean) => ({
  name: COOKIE, value: token, httpOnly: true, sameSite: 'strict' as const, secure, path: '/', maxAge: TTL_SECONDS,
});
export const clearedCookie = (secure: boolean) => ({
  name: COOKIE, value: '', httpOnly: true, sameSite: 'strict' as const, secure, path: '/', maxAge: 0,
});

// ---------- PIN (stored as a salted scrypt hash, never in plain text) ----------

function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pin, salt, 32);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

function checkHash(pin: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(pin, Buffer.from(saltHex, 'hex'), 32);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export const PIN_PATTERN = /^\d{4,8}$/;

export async function verifyPin(pin: string): Promise<boolean> {
  let db = await getDB();
  if (!db.settings.pinHash) {
    const initial = process.env.ADMIN_PIN;
    if (!initial && process.env.NODE_ENV === 'production') throw new Error('ADMIN_PIN must be set on first run.');
    await mutate((d) => {
      if (!d.settings.pinHash) d.settings.pinHash = hashPin(initial || '1234');
    });
    db = await getDB();
  }
  return checkHash(pin, db.settings.pinHash!);
}

export async function setPin(pin: string): Promise<void> {
  await mutate((d) => {
    d.settings.pinHash = hashPin(pin);
  });
}

// ---------- Simple in-memory rate limiter (per server instance) ----------

const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count += 1;
  return { ok: b.count <= max, retryAfter: Math.ceil((b.reset - now) / 1000) };
}

export function clearRateLimit(key: string) {
  buckets.delete(key);
}

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'local';
}

export function isSecureRequest(req: Request): boolean {
  return req.headers.get('x-forwarded-proto') === 'https' || new URL(req.url).protocol === 'https:';
}
