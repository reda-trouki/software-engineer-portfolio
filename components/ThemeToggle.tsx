'use client';

import { useI18n } from './I18nProvider';

// The head script in layout.tsx sets data-theme before first paint, so the
// icon is chosen with CSS (no hydration mismatch, no flash).
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { t } = useI18n();
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch {}
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t.nav.theme}
      title={t.nav.theme}
      className={`flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line2 text-fg transition-colors hover:bg-line ${className}`}
    >
      <svg className="hidden [[data-theme=light]_&]:block" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
      <svg className="block [[data-theme=light]_&]:hidden" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
    </button>
  );
}
