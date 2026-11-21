import crypto from 'crypto';
import { fail, guard, json, readJson, sameOrigin } from '@/lib/api';
import { clientIp, rateLimit } from '@/lib/auth';
import { validate, type Field } from '@/lib/collections';
import { getDB, mutate } from '@/lib/store';
import { sendContactMail } from '@/lib/mail';

const CONTACT_FIELDS: Field[] = [
  { key: 'name', label: 'Name', kind: 'text', max: 100, required: true },
  { key: 'email', label: 'Email', kind: 'text', max: 120, required: true },
  { key: 'message', label: 'Message', kind: 'area', max: 4000, required: true },
];

// Public: visitors send a message. It is stored and shown in Admin > Messages.
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, 'Cross-origin request blocked.');

  const limit = rateLimit(`contact:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return fail(429, 'Too many messages. Please try again later.');

  const body = await readJson(req);
  // honeypot: real people never fill this hidden field
  if (body && typeof body === 'object' && (body as Record<string, unknown>).hp_trap) return json({ ok: true });

  const result = validate(CONTACT_FIELDS, body);
  if ('error' in result) return fail(400, result.error);

  const msg = result.data as { name: string; email: string; message: string };
  const id = crypto.randomUUID();
  await mutate((db) => {
    db.messages.unshift({ id, date: new Date().toISOString(), ...msg });
    db.messages = db.messages.slice(0, 500); // keep the file small
  });

  // Email notification: never blocks or fails the visitor's request
  const db = await getDB();
  const emailed = await sendContactMail(msg, db.profile.email);
  if (emailed) await mutate((d) => { const m = d.messages.find((x) => x.id === id); if (m) m.emailed = true; });
  return json({ ok: true }, { status: 201 });
}

export async function GET(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  const db = await getDB();
  return json(db.messages);
}
