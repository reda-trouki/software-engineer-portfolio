import type { MetadataRoute } from 'next';
import { getDB } from '@/lib/store';
import { siteUrl } from './robots';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const db = await getDB();
  return [
    { url: base, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/templates`, changeFrequency: 'monthly', priority: 0.6 },
    ...db.posts.map((p) => ({ url: `${base}/blog/${p.slug || p.id}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
