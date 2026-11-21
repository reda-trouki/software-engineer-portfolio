'use client';

import { useRef, useState, type ReactNode } from 'react';

/** A code block with a language label and a copy button. */
export default function CodeBlock({ lang, children, labels }: { lang: string; children: ReactNode; labels?: { copy: string; copied: string } }) {
  const pre = useRef<HTMLPreElement>(null);
  const [done, setDone] = useState(false);
  const l = labels ?? { copy: 'Copy', copied: 'Copied' };

  async function copy() {
    try {
      await navigator.clipboard.writeText(pre.current?.textContent ?? '');
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch { /* clipboard blocked: nothing to do */ }
  }

  return (
    <div dir="ltr" className="not-prose my-7 overflow-hidden rounded-2xl border border-line2 bg-[#0d0f13]">
      <div className="flex items-center justify-between border-b border-line2 bg-[#131519] px-4 py-2 font-mono text-[#9da0a8] text-[11px] text-muted">
        <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#3a3d45]" /><i className="size-2 rounded-full bg-[#3a3d45]" /><i className="size-2 rounded-full bg-[#3a3d45]" /><span className="ms-2 uppercase tracking-wider">{lang || 'code'}</span></span>
        <button type="button" onClick={copy} className="cursor-pointer rounded-full border border-line2 px-2.5 py-1 transition-colors hover:text-[#eceae3]">{done ? l.copied : l.copy}</button>
      </div>
      <pre ref={pre} className="overflow-x-auto p-4 font-mono text-[13.5px] leading-[1.7] text-[#d8d6cf]">{children}</pre>
    </div>
  );
}
