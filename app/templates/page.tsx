import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Nav from '@/components/Nav';
import SplitWords from '@/components/SplitWords';
import TemplatesGrid from '@/components/TemplatesGrid';
import { splitList } from '@/lib/format';
import { getI18n } from '@/lib/locale';
import { getDB } from '@/lib/store';
import { label, wrap } from '@/lib/ui';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Templates' };

export default async function TemplatesPage() {
  const db = await getDB();
  const { t, locale, tr } = await getI18n();
  const templates = db.templates.map((x) => ({
    id: x.id, name: tr(x, 'name'), category: tr(x, 'category'), price: tr(x, 'price'), free: x.price.trim().toLowerCase() === 'free', description: tr(x, 'description'),
    stack: splitList(x.stack), link: x.link,
  }));

  return (
    <>
      <Nav name={db.profile.name} active="templates" />
      <section className="dotgrid border-b border-line">
        <div className={`${wrap} grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] items-end gap-8 pb-12 pt-14 sm:pt-16`}>
          <div className="flex flex-col gap-6">
            <div data-a data-hero className={label}><bdi dir="ltr">~/templates</bdi></div>
            <h1 data-hero-split className="font-hd text-[clamp(30px,4.4vw,52px)] font-semibold leading-[1.06] tracking-[-0.035em]">
              <SplitWords text={t.templates.title} highlight={t.templates.hl} />
            </h1>
          </div>
          <p data-a data-hero className="max-w-[460px] text-pretty text-base leading-[1.7] text-muted sm:text-[17px]">{t.templates.sub}</p>
        </div>
      </section>
      <section className="bg-paper text-ink">
        <div className={`${wrap} pb-28 pt-12`}>
          <TemplatesGrid key={locale} templates={templates} />
        </div>
      </section>
      <Footer name={tr(db.profile, 'name')} />
    </>
  );
}
