'use client';

import { useState } from 'react';
import { useI18n } from './I18nProvider';

export default function CopyEmail({ email }: { email: string }) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(email); } catch { return; }
    setDone(true);
    setTimeout(() => setDone(false), 1800);
  }
  return (
    <div data-reveal className="flex items-stretch overflow-hidden rounded-2xl border-2 border-ink/90">
      <a href={`mailto:${email}`} dir="ltr" className="flex min-h-12 min-w-0 flex-1 items-center truncate px-4 text-[clamp(15px,1.6vw,19px)] font-medium">{email}</a>
      <button type="button" onClick={copy} className="min-w-[84px] shrink-0 cursor-pointer border-s-2 border-ink/90 bg-ink px-4 font-mono text-xs text-[#eceae3] transition-colors hover:bg-[#1b1e24]">
        <span aria-live="polite">{done ? t.contact.copied : t.contact.copy}</span>
      </button>
    </div>
  );
}
