import { readFile } from '@/lib/files';

const TYPES: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

// Serves uploaded images. The strict filename pattern blocks path traversal.
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const match = /^([\w-]+)\.(jpg|jpeg|png|webp)$/.exec(file);
  if (!match) return new Response('Not found', { status: 404 });
  const data = await readFile(file).catch(() => null);
  if (!data) return new Response('Not found', { status: 404 });
  return new Response(data as BodyInit, {
    headers: {
      'Content-Type': TYPES[match[2]],
      'Cache-Control': 'public, max-age=31536000, immutable', // file names are unique per upload
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
