'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Dict, Locale } from '@/lib/i18n';

const Ctx = createContext<{ locale: Locale; t: Dict } | null>(null);

export function I18nProvider({ locale, t, children }: { locale: Locale; t: Dict; children: ReactNode }) {
  return <Ctx.Provider value={{ locale, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n must be used inside <I18nProvider>');
  return v;
}
