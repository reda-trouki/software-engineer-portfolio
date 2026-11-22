import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/noto-sans-arabic';
import './globals.css';
import Animations from '@/components/Animations';
import { getDB } from '@/lib/store';
import { ACCENTS } from '@/lib/collections';
import { I18nProvider } from '@/components/I18nProvider';
import { getI18n } from '@/lib/locale';
import { Analytics } from "@vercel/analytics/next"

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getDB();
  const { tr } = await getI18n();
  const name = tr(profile, 'name');
  return {
    title: { default: `${name} · ${tr(profile, 'role')}`, template: `%s · ${name}` },
    description: tr(profile, 'intro') || tr(profile, 'headline'),
    icons: {
      icon: "/assets/favicon.ico",
      apple: "/assets/apple-touch-icon.png",
    }
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { profile } = await getDB();
  const { locale, t, dir } = await getI18n();
  const accent = ACCENTS.includes(profile.accent) ? profile.accent : ACCENTS[0];
  return (
    <html lang={locale} dir={dir} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning style={{ '--accent': accent } as CSSProperties}>
        {/* sets the theme before first paint (saved choice, else system preference) */}
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}" }} />
        {/* marks that JS is running so hero items can be pre-hidden without a flash */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <I18nProvider locale={locale} t={t}>{children}</I18nProvider>
        <Animations />
        <Analytics />
      </body>
    </html>
  );
}
