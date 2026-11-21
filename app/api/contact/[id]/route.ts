import { fail, guard, json } from '@/lib/api';
import { mutate } from '@/lib/store';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard(req, { write: true });
  if (denied) return denied;

  const { id } = await params;
  const removed = await mutate((db) => {
    const before = db.messages.length;
    db.messages = db.messages.filter((m) => m.id !== id);
    return db.messages.length < before;
  });
  return removed ? json({ ok: true }) : fail(404, 'Not found.');
}
