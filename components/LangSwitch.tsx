'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { LOCALES, type Locale } from '@/lib/i18n';
import { useI18n } from './I18nProvider';

const NAMES: Record<Locale, string> = { en: 'EN', fr: 'FR', ar: 'عربي' };
const FULL: Record<Locale, string> = { en: 'English', fr: 'Français', ar: 'العربية' };

/** Segmented EN | FR | عربي switch. Stores the choice in a cookie and refreshes the server-rendered page. */
export default function LangSwitch({ className = '' }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();

  function pick(l: Locale) {
    if (l === locale) return;
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    start(() => router.refresh());
  }

  return (
    <div dir="ltr" role="group" aria-label={t.nav.language} className={`items-center rounded-full border border-line2 p-0.5 ${pending ? 'opacity-60' : ''} ${className}`}>
      {LOCALES.map((l) => (
        <button
          key={l} type="button" lang={l} aria-pressed={l === locale} aria-label={FULL[l]} onClick={() => pick(l)}
          className="min-h-8 min-w-9 cursor-pointer rounded-full px-2.5 font-mono text-[11px] font-medium text-muted transition-colors hover:text-fg aria-pressed:bg-accent aria-pressed:text-ink"
        >{NAMES[l]}</button>
      ))}
    </div>
  );
}
