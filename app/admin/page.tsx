import type { Metadata } from 'next';
import AdminPanel from '@/components/admin/AdminPanel';
import PinGate from '@/components/admin/PinGate';
import { isAuthed } from '@/lib/auth';
import { COLLECTION_KEYS, type CollectionKey } from '@/lib/collections';
import { getDB, type Item } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default async function AdminPage() {
  // The server decides: without a valid session cookie, no admin data is ever sent to the browser.
  if (!(await isAuthed())) return <PinGate />;

  const db = await getDB();
  const data = {} as Record<CollectionKey, Item[]>;
  COLLECTION_KEYS.forEach((k) => { data[k] = db[k]; });

  return <AdminPanel initial={{ profile: db.profile, data, messages: db.messages }} />;
}
