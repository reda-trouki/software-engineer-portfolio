'use client';

import { useEffect, useState } from 'react';
import type { TocItem } from '@/lib/toc';

/** "On this page": a sticky list on desktop (with scroll-spy) and a collapsible list on mobile. */
export default function PostToc({ items, title }: { items: TocItem[]; title: string }) {
  const [active, setActive] = useState(items[0]?.id ?? '');

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const update = () => {
      // the active section is the last heading that has passed the top third of the screen
      let cur = els[0].id;
      for (const el of els) if (el.getBoundingClientRect().top <= window.innerHeight * 0.3) cur = el.id;
      setActive(cur);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [items]);

  const list = (
    <ol className="flex flex-col border-s border-line2">
      {items.map((i) => (
        <li key={i.id}>
          <a
            href={`#${i.id}`} aria-current={active === i.id ? 'location' : undefined}
            className={`-ms-px block border-s py-1.5 text-[13.5px] leading-snug transition-colors ${i.level === 3 ? 'ps-7' : 'ps-4'} ${active === i.id ? 'border-accent font-medium text-fg' : 'border-transparent text-muted hover:text-fg'}`}
          >{i.text}</a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <details className="mb-10 rounded-2xl border border-line2 bg-surface lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 font-mono text-xs uppercase tracking-[0.14em] text-muted [&::-webkit-details-marker]:hidden">{title}<span aria-hidden="true">+</span></summary>
        <div className="px-5 pb-4">{list}</div>
      </details>
      <aside aria-label={title} className="hidden lg:visible lg:sticky lg:top-28 lg:order-2 lg:block lg:self-start">
        <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{title}</div>
        {list}
      </aside>
    </>
  );
}
