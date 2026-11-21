'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { h2, tagLight } from '@/lib/ui';
import { useI18n } from './I18nProvider';
import { useStaggerIn } from './useStaggerIn';

export interface ProjectView {
  id: string;
  name: string;
  type: string;
  description: string;
  stack: string[];
  image?: string;
  liveUrl: string;
  codeUrl: string;
}

export default function ProjectsSection({ projects }: { projects: ProjectView[] }) {
  const { t } = useI18n();
  const ALL = '__all';
  const [filter, setFilter] = useState(ALL);
  const grid = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false); // desktop: first batch only until expanded
  const [idx, setIdx] = useState(0); // mobile: current card in the swipe carousel
  const DESKTOP_LIMIT = 4;
  useStaggerIn(grid, filter);

  const types = useMemo(() => [ALL, ...Array.from(new Set(projects.map((p) => p.type)))], [projects]);
  const onScroll = () => {
    const el = grid.current;
    if (!el || !el.children.length) return;
    const first = el.children[0] as HTMLElement;
    const step = first.offsetWidth + 16;
    setIdx(Math.min(el.children.length - 1, Math.round(Math.abs(el.scrollLeft) / step)));
  };
  const slide = (d: 1 | -1) => {
    const el = grid.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === 'rtl';
    const step = (el.children[0] as HTMLElement).offsetWidth + 16;
    el.scrollBy({ left: d * step * (rtl ? -1 : 1), behavior: 'smooth' });
  };
  const shown = projects.map((p, i) => ({ ...p, i })).filter((p) => filter === ALL || p.type === filter);

  // new filter -> back to the first card
  useEffect(() => { setIdx(0); grid.current?.scrollTo({ left: 0 }); }, [filter]);
  // cards revealed by "show more" must not stay hidden by the scroll-in animation
  useEffect(() => {
    const kids = grid.current ? Array.from(grid.current.children) : [];
    if (kids.length) gsap.set(kids, { y: 0, opacity: 1 });
  }, [expanded]);

  const hiddenCount = Math.max(0, shown.length - DESKTOP_LIMIT);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-7 md:mb-12">
        <div className="flex flex-col gap-[18px]" data-reveal>
          <div className="font-mono text-xs uppercase tracking-[0.14em] text-soft">02 — {t.projects.kicker}</div>
          <h2 className={h2}>{t.projects.title}</h2>
        </div>
        {types.length > 2 && (
          <div className="-mx-5 flex max-w-[100vw] gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:max-w-none sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden" role="group" aria-label={t.projects.filter} data-reveal>
            {types.map((ty) => (
              <button
                key={ty} type="button" aria-pressed={filter === ty} onClick={() => setFilter(ty)}
                className="min-h-11 shrink-0 cursor-pointer rounded-full border border-ink/25 px-5 font-mono text-[13px] text-ink transition-colors aria-pressed:bg-ink aria-pressed:text-paper"
              >{ty === ALL ? t.c.all : ty}</button>
            ))}
          </div>
        )}
      </div>

      {shown.length === 0 && <div className="py-14 text-center text-soft">{t.projects.none}</div>}

      <div
        ref={grid} onScroll={onScroll}
        className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-2 [scrollbar-width:none] sm:-mx-8 sm:px-8 md:mx-0 md:grid md:grid-cols-[repeat(auto-fit,minmax(min(440px,100%),1fr))] md:gap-6 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        {shown.map((p, n) => (
          <article key={p.id} className={`${!expanded && n >= DESKTOP_LIMIT ? 'md:hidden' : ''} group flex w-[84%] shrink-0 snap-center flex-col sm:w-[60%] md:w-auto md:shrink overflow-hidden rounded-3xl border border-ink/15 bg-card transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_50px_-28px_rgba(0,0,0,0.4)]`}>
            <div className={`${p.image ? 'bg-ink' : `thumb-${p.i % 4}`} relative h-[150px] overflow-hidden md:h-[200px] border-b border-ink/15`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.image && <img src={p.image} alt={p.name} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
              <span className="absolute start-4 top-4 rounded-full bg-card px-3 py-1 font-mono text-[11px]">{String(p.i + 1).padStart(2, '0')}</span>
            </div>
            <div className="flex flex-1 flex-col gap-3 p-6">
              <div className="font-mono text-xs text-soft">{p.type}</div>
              <h3 className="font-hd text-[22px] font-semibold leading-[1.15] tracking-[-0.02em]">{p.name}</h3>
              {p.description && <p className="text-pretty text-[15px] leading-relaxed text-[#4a4c52]">{p.description}</p>}
              {p.stack.length > 0 && <div className="flex flex-wrap gap-2">{p.stack.map((s) => <span key={s} className={tagLight}>{s}</span>)}</div>}
              {(p.liveUrl || p.codeUrl) && (
                <div className="mt-auto flex flex-wrap gap-6 pt-2.5">
                  {p.liveUrl && <a className="inline-flex min-h-11 items-center border-b-2 border-ink font-mono text-sm font-medium" href={p.liveUrl} target="_blank" rel="noopener noreferrer">{t.projects.live} ↗</a>}
                  {p.codeUrl && <a className="inline-flex min-h-11 items-center border-b-2 border-ink font-mono text-sm font-medium" href={p.codeUrl} target="_blank" rel="noopener noreferrer">{t.projects.code} ↗</a>}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* mobile: counter + arrows for the swipe carousel */}
      {shown.length > 1 && (
        <div className="mt-5 flex items-center justify-between md:hidden">
          <div className="font-mono text-xs text-soft" dir="ltr">{String(idx + 1).padStart(2, '0')} / {String(shown.length).padStart(2, '0')}</div>
          <div className="flex gap-2">
            <button type="button" aria-label={t.projects.prev} onClick={() => slide(-1)} disabled={idx === 0} className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-ink/25 text-ink transition-colors hover:bg-ink hover:text-paper disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink rtl:rotate-180">←</button>
            <button type="button" aria-label={t.projects.next} onClick={() => slide(1)} disabled={idx >= shown.length - 1} className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-ink/25 text-ink transition-colors hover:bg-ink hover:text-paper disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink rtl:rotate-180">→</button>
          </div>
        </div>
      )}

      {/* desktop: show a first batch, expand on demand */}
      {hiddenCount > 0 && (
        <div className="mt-10 hidden justify-center md:flex">
          <button type="button" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)} className="min-h-12 cursor-pointer rounded-full border border-ink/25 px-7 font-mono text-[13px] text-ink transition-colors hover:bg-ink hover:text-paper">
            {expanded ? t.projects.less : t.projects.more.replace('{n}', String(hiddenCount))}
          </button>
        </div>
      )}
    </>
  );
}
