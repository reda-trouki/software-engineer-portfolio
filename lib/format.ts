import { DATE_LOCALE, type Locale } from './i18n';

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'post'
  );
}

export function formatDate(iso: string, locale: Locale = 'en'): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(DATE_LOCALE[locale], { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC' });
}

/** Whole minutes to read; the caller formats the label (it is localised). */
export function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export const splitList = (s: string | undefined): string[] =>
  (s || '').split(',').map((x) => x.trim()).filter(Boolean);

export const splitLines = (s: string | undefined): string[] =>
  (s || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

export const splitParas = (s: string | undefined): string[] =>
  (s || '').split(/\r?\n\s*\r?\n/).map((x) => x.trim()).filter(Boolean);

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] || 'me').slice(0, 2)).toUpperCase();
}
