'use client';

import { useState } from 'react';

export default function CopyLink({ label, done }: { label: string; done: string }) {
  const [ok, setOk] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href.split('#')[0]);
      setOk(true);
      setTimeout(() => setOk(false), 1800);
    } catch { /* clipboard blocked */ }
  }
  return (
    <button type="button" onClick={copy} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line2 px-4 font-mono text-[13px] text-fg transition-colors hover:border-accent">
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1" /></svg>
      {ok ? done : label}
    </button>
  );
}
