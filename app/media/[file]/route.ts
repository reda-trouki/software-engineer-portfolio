import { promises as fs } from 'fs';
import path from 'path';

const TYPES: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const DIR = path.join(process.env.DATA_DIR || path.join(process.cwd(), 'data'), 'uploads');

// Serves uploaded images. The strict filename pattern blocks path traversal.
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const match = /^([\w-]+)\.(jpg|jpeg|png|webp)$/.exec(file);
  if (!match) return new Response('Not found', { status: 404 });
  try {
    const data = await fs.readFile(path.join(DIR, file));
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': TYPES[match[2]],
        'Cache-Control': 'public, max-age=31536000, immutable', // file names are unique per upload
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
