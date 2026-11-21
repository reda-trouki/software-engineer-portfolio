import { fail, guard, json } from '@/lib/api';
import { saveFile, removeByPrefix } from '@/lib/files';
import { mutate } from '@/lib/store';

const MAX_BYTES = 5 * 1024 * 1024;
const MIME = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' } as const;

// Identify the real image type from its first bytes (never trust the filename or MIME header).
function detect(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 12 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

// Owner uploads an image. kind=photo (default) becomes profile.photoUrl; kind=image is a content image
// (blog cover, inline image, certificate badge) and only returns its URL.
export async function POST(req: Request) {
  const denied = await guard(req, { write: true });
  if (denied) return denied;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, 'Expected a file upload.');
  }
  const kind = form.get('kind') === 'image' ? 'image' : 'photo';
  const file = form.get('file');
  if (!(file instanceof File)) return fail(400, 'No file received.');
  if (file.size > MAX_BYTES) return fail(413, 'Image is too large (max 5 MB).');

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = detect(buf);
  if (!ext) return fail(400, 'Please upload a JPG, PNG or WebP image.');

  const name = kind === 'photo' ? `photo-${Date.now()}.${ext}` : `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await saveFile(name, buf, MIME[ext]);

  const url = `/media/${name}`;
  if (kind === 'image') return json({ url });
  await mutate((db) => {
    db.profile.photoUrl = url;
  });

  // remove older uploaded photos
  await removeByPrefix('photo-', name);
  return json({ url });
}
