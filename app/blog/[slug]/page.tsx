import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CopyLink from '@/components/CopyLink';
import Footer from '@/components/Footer';
import Markdown from '@/components/Markdown';
import Nav from '@/components/Nav';
import PostToc from '@/components/PostToc';
import SplitWords from '@/components/SplitWords';
import { isAuthed } from '@/lib/auth';
import { formatDate, initials, readingMinutes } from '@/lib/format';
import { fmt } from '@/lib/i18n';
import { getI18n } from '@/lib/locale';
import { getDB } from '@/lib/store';
import { extractToc } from '@/lib/toc';
import { label } from '@/lib/ui';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

async function findPost(slug: string) {
  const db = await getDB();
  const post = db.posts.find((p) => p.slug === slug);
  // drafts are only visible to the signed-in owner (handy for previewing)
  if (!post || (post.status !== 'Published' && !(await isAuthed()))) return null;
  return { db, post };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await findPost((await params).slug);
  const { t, tr } = await getI18n();
  if (!found) return { title: t.blog.notFound };
  const { post } = found;
  return {
    title: tr(post, 'title'),
    description: tr(post, 'excerpt') || undefined,
    openGraph: post.cover ? { images: [post.cover] } : undefined,
  };
}

export default async function PostPage({ params }: Props) {
  const found = await findPost((await params).slug);
  if (!found) notFound();
  const { db, post } = found;
  const { t, locale, tr } = await getI18n();

  const body = tr(post, 'body');
  const toc = extractToc(body);
  const author = tr(db.profile, 'name');
  const more = db.posts
    .filter((p) => p.status === 'Published' && p.id !== post.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 2);

  const avatar = db.profile.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={db.profile.photoUrl} alt="" className="size-full object-cover" />
  ) : (
    <span className="font-mono text-xs font-semibold">{initials(db.profile.name)}</span>
  );

  return (
    <>
      {/* reading progress */}
      <div data-progress aria-hidden="true" className="fixed start-0 top-0 z-50 h-[3px] w-full origin-left scale-x-0 bg-accent rtl:origin-right" />
      <Nav name={db.profile.name} active="blog" />

      <article>
        {/* ---------- header ---------- */}
        <header className="dotgrid border-b border-line">
          <div className="mx-auto max-w-[1120px] px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-14">
            <Link data-a data-hero href="/blog" className="inline-flex min-h-11 items-center font-mono text-sm text-muted transition-colors hover:text-fg">{t.c.back} {t.blog.back}</Link>

            <div data-a data-hero className="mt-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-accent px-3 py-1 font-mono text-xs font-medium text-ink">{tr(post, 'topic')}</span>
              {post.status !== 'Published' && <span className="rounded-full bg-warn px-3 py-1 font-mono text-xs text-ink">{t.blog.draft}</span>}
            </div>

            <h1 data-hero-split className="mt-5 max-w-[860px] font-hd text-[clamp(30px,4.4vw,52px)] font-semibold leading-[1.08] tracking-[-0.035em] text-balance">
              <SplitWords text={tr(post, 'title')} />
            </h1>

            {tr(post, 'excerpt') && <p data-a data-hero className="mt-5 max-w-[680px] text-pretty text-lg leading-relaxed text-muted sm:text-xl">{tr(post, 'excerpt')}</p>}

            <div data-a data-hero className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center overflow-hidden rounded-full border border-line2 bg-surface">{avatar}</span>
                <div className="flex flex-col leading-tight">
                  <span className="text-[15px] font-medium">{author}</span>
                  <span className="font-mono text-xs text-muted">{tr(db.profile, 'role')}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[13px] text-muted">
                <span>{formatDate(post.date, locale)}</span>
                <span>{fmt(t.c.minRead, { n: readingMinutes(body) })}</span>
              </div>
            </div>
          </div>
        </header>

        {/* ---------- cover ---------- */}
        {post.cover && (
          <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
            <figure data-photo className="-mt-6 overflow-hidden rounded-[28px] border border-line2 bg-surface shadow-[0_40px_80px_-50px_rgba(0,0,0,0.9)] sm:-mt-10 sm:rounded-[36px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.cover} alt="" className="aspect-[2/1] w-full object-cover" />
            </figure>
          </div>
        )}

        {/* ---------- body + table of contents ---------- */}
        <div className="mx-auto grid max-w-[1120px] gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[minmax(0,720px)_230px] lg:justify-center lg:gap-16">
          {toc.length > 1 && <PostToc items={toc} title={t.blog.toc} />}
          <div className="min-w-0 lg:order-1">
            <Markdown source={body} labels={{ copy: t.blog.copy, copied: t.blog.copied }} />

            {/* author + share */}
            <div className="mt-16 flex flex-wrap items-center justify-between gap-5 rounded-3xl border border-line2 bg-surface p-6 sm:p-7">
              <div className="flex items-center gap-4">
                <span className="grid size-14 place-items-center overflow-hidden rounded-full border border-line2 bg-bg">{avatar}</span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{t.blog.writtenBy}</span>
                  <b className="font-hd text-lg font-semibold">{author}</b>
                  <span className="text-sm text-muted">{tr(db.profile, 'role')}</span>
                </div>
              </div>
              <CopyLink label={t.blog.copyLink} done={t.blog.linkCopied} />
            </div>
          </div>
        </div>

        {/* ---------- keep reading ---------- */}
        {more.length > 0 && (
          <div className="border-t border-line">
            <div className="mx-auto max-w-[1120px] px-5 py-16 sm:px-8">
              <div className={`${label} mb-6`}>{t.blog.keep}</div>
              <div data-stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {more.map((m) => (
                  <Link key={m.id} href={`/blog/${m.slug}`} className="group flex flex-col overflow-hidden rounded-3xl border border-line2 bg-surface transition duration-300 hover:-translate-y-1.5 hover:border-hl">
                    {m.cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.cover} alt="" loading="lazy" className="aspect-[2/1] w-full border-b border-line2 object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    )}
                    <div className="flex flex-col gap-3 p-6">
                      <span className="font-mono text-xs text-muted">{formatDate(m.date, locale)} · {tr(m, 'topic')}</span>
                      <span className="font-hd text-lg font-semibold leading-snug">{tr(m, 'title')}</span>
                      <span className="mt-1 font-mono text-[13px] text-accent">{t.blog.read} {t.c.arrow}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </article>

      <Footer name={tr(db.profile, 'name')} />
    </>
  );
}
