import { cookies, headers } from 'next/headers';
import { DICTS, DEFAULT_LOCALE, dirOf, isLocale, tr as trBase, type Dict, type Locale } from './i18n';

/** Locale for this request: the `lang` cookie, else the browser's Accept-Language, else English. */
export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get('lang')?.value;
  if (isLocale(c)) return c;
  const accept = (await headers()).get('accept-language') || '';
  for (const part of accept.split(',')) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
}

export async function getI18n(): Promise<{ locale: Locale; t: Dict; dir: 'ltr' | 'rtl'; tr: (o: Record<string, string> | undefined, key: string) => string }> {
  const locale = await getLocale();
  return { locale, t: DICTS[locale], dir: dirOf(locale), tr: (o, key) => trBase(o, key, locale) };
}
