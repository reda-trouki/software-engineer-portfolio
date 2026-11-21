import type { Metadata } from 'next';
import BlogList from '@/components/BlogList';
import Footer from '@/components/Footer';
import Nav from '@/components/Nav';
import SplitWords from '@/components/SplitWords';
import { formatDate, readingMinutes } from '@/lib/format';
import { getI18n } from '@/lib/locale';
import { getDB } from '@/lib/store';
import { label, wrap } from '@/lib/ui';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Blog' };

export default async function BlogPage() {
  const db = await getDB();
  const { t, locale, tr } = await getI18n();
  const posts = db.posts
    .filter((p) => p.status === 'Published')
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((p) => ({ slug: p.slug, title: tr(p, 'title'), topic: tr(p, 'topic'), excerpt: tr(p, 'excerpt'), date: formatDate(p.date, locale), read: readingMinutes(tr(p, 'body')), cover: p.cover || undefined }));

  return (
    <>
      <Nav name={db.profile.name} active="blog" />
      <section className="dotgrid border-b border-line">
        <div className={`${wrap} flex flex-col gap-5 pb-12 pt-14 sm:pt-16`}>
          <div data-a data-hero className={label}><bdi dir="ltr">~/blog</bdi></div>
          <h1 data-hero-split className="font-hd text-[clamp(30px,4.4vw,52px)] font-semibold leading-[1.06] tracking-[-0.035em]">
            <SplitWords text={t.blog.title} highlight={t.blog.hl} />
          </h1>
          <p data-a data-hero className="max-w-[560px] text-pretty text-base leading-[1.7] text-muted sm:text-[17px]">{t.blog.sub}</p>
        </div>
      </section>
      <section className={`${wrap} pb-28 pt-10`}>
        <BlogList key={locale} posts={posts} />
        {posts.length === 0 && <div className="py-16 text-center text-muted">{t.blog.none}</div>}
      </section>
      <Footer name={tr(db.profile, 'name')} />
    </>
  );
}
