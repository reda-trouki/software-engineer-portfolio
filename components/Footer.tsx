import Link from 'next/link';
import { getI18n } from '@/lib/locale';
import { navLink, wrap } from '@/lib/ui';

export default async function Footer({ name }: { name: string }) {
  const { t } = await getI18n();
  return (
    <footer>
      <div className={`${wrap} flex flex-wrap items-center justify-between gap-x-7 gap-y-3 py-8 font-mono text-xs text-muted`}>
        <span>© {new Date().getFullYear()} {name}</span>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <Link className={navLink} href="/">{t.c.home}</Link>
          <Link className={navLink} href="/blog">{t.nav.blog}</Link>
          <Link className={navLink} href="/templates">{t.nav.templates}</Link>
          <Link className={`${navLink} gap-2`} href="/admin" aria-label="Admin (PIN required)">
            <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
            {t.c.admin}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
