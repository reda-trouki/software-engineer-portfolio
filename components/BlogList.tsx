'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { fmt } from '@/lib/i18n';
import { useI18n } from './I18nProvider';
import { useStaggerIn } from './useStaggerIn';

export interface PostView {
  slug: string;
  title: string;
  topic: string;
  excerpt: string;
  date: string;
  read: number;
  cover?: string;
}

// the same four patterns as the project thumbnails
const thumbCls = (i: number) => `thumb-${i % 4}`;

export default function BlogList({ posts }: { posts: PostView[] }) {
  const { t } = useI18n();
  const ALL = '__all';
  const [topic, setTopic] = useState(ALL);
  const [query, setQuery] = useState('');
  const grid = useRef<HTMLDivElement>(null);
  const q = query.trim().toLowerCase();
  useStaggerIn(grid, `${topic}|${q}`);

  const topics = useMemo(() => [ALL, ...Array.from(new Set(posts.map((p) => p.topic)))], [posts]);
  const list = posts
    .map((p, i) => ({ ...p, i }))
    .filter((p) => (topic === ALL || p.topic === topic) && (!q || `${p.title} ${p.excerpt}`.toLowerCase().includes(q)));
  const [featured, ...rest] = list;

  const card = 'group flex flex-col overflow-hidden rounded-3xl border border-line2 bg-surface transition duration-300 hover:-translate-y-1.5 hover:border-hl hover:bg-surface';

  return (
    <>
      <div className="mb-10 flex flex-wrap items-center justify-between gap-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t.blog.filter}>
          {topics.map((tp) => (
            <button
              key={tp} type="button" aria-pressed={topic === tp} onClick={() => setTopic(tp)}
              className="min-h-11 cursor-pointer rounded-full border border-line2 px-[18px] font-mono text-sm text-fg transition-colors aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-ink"
            >{tp === ALL ? t.c.all : tp}</button>
          ))}
        </div>
        <div className="flex w-full max-w-[320px] flex-col gap-1.5">
          <label htmlFor="q" className="font-mono text-xs text-muted">{t.blog.search}</label>
          <input id="q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.blog.searchPh} className="min-h-12 rounded-full border border-line2 bg-surface px-5 text-[15px] text-fg placeholder:text-soft" />
        </div>
      </div>

      {featured && (
        <Link key={featured.slug} href={`/blog/${featured.slug}`} className={`${card} mb-8 grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))]`}>
          <div className={`${thumbCls(featured.i)} min-h-[260px] border-b border-line2 bg-cover bg-center sm:min-h-[340px] sm:border-b-0 sm:border-e`} style={featured.cover ? { backgroundImage: `url(${featured.cover})` } : undefined} />
          <div className="flex flex-col justify-center gap-[18px] p-6 sm:p-9">
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-xs text-muted"><span className="text-accent">{t.blog.featured}</span><span>{featured.date}</span><span>{fmt(t.c.minRead, { n: featured.read })}</span></div>
            <h3 className="font-hd text-[clamp(22px,2.6vw,32px)] font-semibold leading-[1.12] tracking-[-0.025em] text-balance">{featured.title}</h3>
            {featured.excerpt && <p className="text-pretty text-base leading-[1.65] text-muted">{featured.excerpt}</p>}
            <div className="flex items-center justify-between"><span className="rounded-full border border-line2 px-3 py-1 font-mono text-xs">{featured.topic}</span><span className="font-mono text-sm text-accent">{t.blog.readPost} {t.c.arrow}</span></div>
          </div>
        </Link>
      )}

      <div ref={grid} className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-7">
        {rest.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className={card}>
            <div className={`${thumbCls(p.i)} h-[150px] border-b border-line2 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]`} style={p.cover ? { backgroundImage: `url(${p.cover})` } : undefined} />
            <div className="flex flex-1 flex-col gap-3.5 p-6">
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-xs text-muted"><span>{p.date}</span><span>{fmt(t.c.minRead, { n: p.read })}</span></div>
              <h3 className="font-hd text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-balance">{p.title}</h3>
              {p.excerpt && <p className="text-pretty text-[15px] leading-relaxed text-muted">{p.excerpt}</p>}
              <div className="mt-auto flex items-center justify-between pt-2"><span className="rounded-full border border-line2 px-2.5 py-1 font-mono text-xs">{p.topic}</span><span className="font-mono text-[13px] text-accent">{t.blog.read} {t.c.arrow}</span></div>
            </div>
          </Link>
        ))}
      </div>

      {list.length === 0 && (
        <div className="py-[72px] text-center text-muted">
          <div className="mb-2 font-hd text-[28px] font-medium text-fg">{t.blog.noMatch}</div>
          {t.blog.noMatchHint}
        </div>
      )}
    </>
  );
}
