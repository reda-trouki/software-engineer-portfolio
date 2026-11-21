'use client';

import { useMemo, useRef, useState } from 'react';
import { fmt } from '@/lib/i18n';
import { tagLight } from '@/lib/ui';
import { useI18n } from './I18nProvider';
import { useStaggerIn } from './useStaggerIn';

export interface TemplateView {
  id: string;
  name: string;
  category: string;
  price: string;
  free: boolean;
  description: string;
  stack: string[];
  link: string;
}

export default function TemplatesGrid({ templates }: { templates: TemplateView[] }) {
  const { t: d } = useI18n();
  const ALL = '__all';
  const [cat, setCat] = useState(ALL);
  const grid = useRef<HTMLDivElement>(null);
  useStaggerIn(grid, cat);

  const cats = useMemo(() => [ALL, ...Array.from(new Set(templates.map((t) => t.category)))], [templates]);
  const shown = templates.map((t, i) => ({ ...t, i })).filter((t) => cat === ALL || t.category === cat);

  return (
    <>
      <div className="mb-10 flex flex-wrap items-center justify-between gap-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label={d.templates.filter}>
          {cats.map((c) => (
            <button
              key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}
              className="min-h-11 cursor-pointer rounded-full border border-ink/25 px-5 font-mono text-[13px] text-ink transition-colors aria-pressed:bg-ink aria-pressed:text-paper"
            >{c === ALL ? d.c.all : c}</button>
          ))}
        </div>
        <div className="font-mono text-xs text-soft">{fmt(d.templates.count, { n: shown.length })}</div>
      </div>

      {shown.length === 0 && <div className="py-14 text-center text-soft">{d.templates.none}</div>}

      <div ref={grid} className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-7">
        {shown.map((t) => (
          <article key={t.id} className="flex flex-col overflow-hidden rounded-3xl border border-ink/15 bg-card transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_50px_-28px_rgba(0,0,0,0.4)]">
            <div className={`mini-${t.i % 3} h-[170px] border-b border-ink/15 p-5`}>
              <div className="flex h-full flex-col overflow-hidden rounded-md bg-ink">
                <div className="flex gap-[5px] border-b border-line2 px-2.5 py-2"><i className="size-[7px] rounded-full bg-[#3a3d45]" /><i className="size-[7px] rounded-full bg-[#3a3d45]" /><i className="size-[7px] rounded-full bg-[#3a3d45]" /></div>
                <div className="flex flex-1 flex-col gap-[7px] p-3">
                  <i className="h-[7px] w-[46%] rounded-[2px] bg-accent" /><i className="h-[7px] w-[78%] rounded-[2px] bg-line2" /><i className="h-[7px] w-[62%] rounded-[2px] bg-line2" /><i className="h-[7px] w-[70%] rounded-[2px] bg-line2" />
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3 p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-soft">{t.category}</span>
                {t.price && <span className={`rounded-full border border-ink/25 px-2.5 py-1 font-mono text-[11px] font-medium ${t.free ? 'bg-accent' : 'bg-card'}`}>{t.price}</span>}
              </div>
              <h3 className="font-hd text-[20px] font-semibold leading-[1.15] tracking-[-0.02em]">{t.name}</h3>
              {t.description && <p className="text-pretty text-[15px] leading-relaxed text-[#4a4c52]">{t.description}</p>}
              {t.stack.length > 0 && <div className="flex flex-wrap gap-2">{t.stack.map((s) => <span key={s} className={tagLight}>{s}</span>)}</div>}
              {t.link && (
                <div className="mt-auto pt-2.5">
                  <a className="inline-flex min-h-11 items-center border-b-2 border-ink font-mono text-sm font-medium" href={t.link} target="_blank" rel="noopener noreferrer">{d.templates.get} ↗</a>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
