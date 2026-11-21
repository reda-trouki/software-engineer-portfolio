import { existsSync } from 'fs';
import path from 'path';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Marquee from '@/components/Marquee';
import Nav from '@/components/Nav';
import SplitWords from '@/components/SplitWords';
import ContactForm from '@/components/ContactForm';
import CopyEmail from '@/components/CopyEmail';
import ProjectsSection from '@/components/ProjectsSection';
import StackedCards from '@/components/StackedCards';
import Academic from '@/components/Academic';
import { getI18n } from '@/lib/locale';
import { fmt } from '@/lib/i18n';
import { splitLines, splitList, splitParas } from '@/lib/format';
import { getDB } from '@/lib/store';
import { btnGhost, btnPrimary, h2, label, sectionPad, wrap } from '@/lib/ui';
import ProfileCard from '@/components/ProfileCard';

export const dynamic = 'force-dynamic';

// repeat short lists so one copy of a loop is always wider than the screen
function fill<T>(items: T[], min = 12): T[] {
  if (!items.length) return [];
  let out = [...items];
  while (out.length < min) out = out.concat(items);
  return out;
}

const SectionHead = ({ no, title, kicker }: { no: string; title: string; kicker: string }) => (
  <div className="mb-10 flex flex-col gap-3.5 sm:mb-14">
    <div className={label} data-reveal>{no} — {kicker}</div>
    <h2 data-split className={h2}><SplitWords text={title} /></h2>
  </div>
);

export default async function Home() {
  const db = await getDB();
  const { t, locale, tr } = await getI18n();
  const raw = db.profile;
  // every translatable profile field resolved for the current language
  const p = new Proxy(raw, { get: (o, k) => (typeof k === 'string' ? tr(o, k) : undefined) }) as Record<string, string>;

  const available = raw.availability.startsWith('Available');
  const availability = available ? t.hero.available : t.hero.unavailable;
  const photo = p.photoUrl || (existsSync(path.join(process.cwd(), 'public', 'me.jpg')) ? '/me.jpg' : '');
  const techs = db.skills.filter((s) => s.row === 'Technologies');
  const practices = db.skills.filter((s) => s.row !== 'Technologies');
  const focus = techs.slice(0, 3).map((s) => s.name);
  const words = splitList(p.loopWords);
  const paragraphs = splitParas(p.bio);

  const facts = [
    [t.about.based, p.city], [t.about.langs, p.languages], [t.about.currently, p.currently], [t.about.openTo, p.openTo],
  ].filter(([, v]) => v);
  const socials = [['GitHub', raw.github], ['LinkedIn', raw.linkedin], ['X / Other', raw.twitter]].filter(([, v]) => v);

  return (
    <>
      <Nav name={raw.name} />

      {/* ---------------- HERO ---------------- */}
      <section data-spotlight className="spotlight -mt-[68px] border-b border-line pt-[68px]">
        <div className={`${wrap} grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] items-center gap-14 pb-20 pt-14 sm:pt-20`}>
          <div className="flex flex-col gap-6">
            <div data-a data-hero className="inline-flex items-center gap-2.5 self-start rounded-full border border-line2 bg-bg/60 px-3.5 py-1.5 font-mono text-xs text-muted backdrop-blur">
              <span className={`size-1.5 rounded-full ${available ? 'animate-pulse-soft bg-accent' : 'bg-warn'}`} />
              {availability}
            </div>
            <h1 data-hero-split className="font-hd text-[clamp(32px,4.4vw,56px)] font-semibold leading-[1.06] tracking-[-0.035em] text-balance">
              <SplitWords text={p.headline} highlight={p.highlight} />
            </h1>
            {p.intro && <p data-a data-hero className="max-w-[500px] text-pretty text-base leading-[1.7] text-muted sm:text-[17px]">{p.intro}</p>}
            <div data-a data-hero className="mt-1 flex flex-wrap gap-3">
              <Link data-magnetic href="/#projects" className={btnPrimary}>
                {t.hero.viewProjects}
                <svg aria-hidden="true" className="rtl:-scale-x-100" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
              <Link data-magnetic href="/#contact" className={btnGhost}>{t.hero.getInTouch}</Link>
            </div>
          </div>

          <div className="relative" data-a data-editor dir="ltr">
            <div className="force-dark overflow-hidden rounded-2xl border border-line2 bg-surface/90 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur">
              <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                <i className="size-2.5 rounded-full bg-[#3a3d45]" /><i className="size-2.5 rounded-full bg-[#3a3d45]" /><i className="size-2.5 rounded-full bg-[#3a3d45]" />
                <span className="ml-2 font-mono text-xs text-muted">engineer.ts</span>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-4 px-5 py-5 font-mono text-[13px] leading-[1.95]">
                <div aria-hidden="true" className="select-none whitespace-pre text-right text-soft">{'1\n2\n3\n4\n5\n6\n7\n8\n9'}</div>
                <div className="overflow-x-auto whitespace-pre">
                  <div data-code-line><span className="text-[#b69cff]">const</span> engineer = {'{'}</div>
                  <div data-code-line>{'  '}name: <span className="text-accent">&quot;{p.name}&quot;</span>,</div>
                  <div data-code-line>{'  '}role: <span className="text-accent">&quot;{p.role}&quot;</span>,</div>
                  <div data-code-line>{'  '}focus: [{focus.map((f, i) => <span key={f}><span className="text-accent">&quot;{f}&quot;</span>{i < focus.length - 1 ? ', ' : ''}</span>)}],</div>
                  <div data-code-line>{'  '}location: <span className="text-accent">&quot;{p.city}&quot;</span>,</div>
                  <div data-code-line>{'  '}openToWork: <span className="text-[#ffb86b]">{String(available)}</span>,</div>
                  <div data-code-line>{'};'}</div>
                  <div data-code-line>{' '}</div>
                  <div data-code-line>engineer.<span className="text-[#7db7ff]">build</span>()<span className="animate-blink bg-accent text-accent">_</span></div>
                </div>
              </div>
            </div>
            {available && (
              <div data-a data-badge aria-hidden="true" className="absolute right-1 -top-9 flex size-[88px] items-center justify-center rounded-full bg-accent sm:-right-4 sm:-top-11 sm:size-[104px]">
                <svg className="animate-spin-slow absolute inset-0 size-full" viewBox="0 0 124 124"><defs><path id="badgeRing" d="M62,62 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" /></defs><text className="fill-ink font-mono" fontSize={locale === "ar" ? "12" : "11"} fontWeight="500" letterSpacing={locale === "ar" ? "0" : "2"}><textPath href="#badgeRing">{t.hero.badge}{t.hero.badge}</textPath></text></svg>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0b0c0e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M8 7h9v9" /></svg>
              </div>
            )}
          </div>
        </div>
        <div data-a data-hero className={`${wrap} flex flex-wrap gap-x-8 gap-y-2 pb-7 font-mono text-xs text-muted`}>
          {p.city && <span>◦ {p.city}</span>}
          {p.openTo && <span>◦ {fmt(t.hero.openTo, { v: p.openTo })}</span>}
          {focus.length > 0 && <span>◦ {focus.join(' · ')}</span>}
        </div>
      </section>

      {/* ---------------- WORD LOOP ---------------- */}
      {words.length > 0 && (
        <div aria-hidden="true" dir="ltr" className="border-b border-line py-7">
          <Marquee speed={70}>
            {fill(words, 8).map((w, i) => (
              <span key={i} className="flex items-center">
                <span className={`mr-8 whitespace-nowrap text-[clamp(34px,4.6vw,60px)] leading-none ${i % 2 === 0 ? 'font-hd font-semibold tracking-[-0.03em] text-fg' : 'font-serif italic text-accent'}`}>{w}</span>
                <span className="mr-8 inline-block size-2.5 shrink-0 rotate-45 bg-line2" />
              </span>
            ))}
          </Marquee>
        </div>
      )}

      {/* ---------------- ABOUT ---------------- */}

      <section
        id="about"
        className="scroll-mt-20 border-b border-line"
      >
        <div className={`${wrap} ${sectionPad}`}>
          <div
            className="
        grid grid-cols-1 items-center
        gap-10 sm:gap-12
        lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]
        lg:gap-16
      "
          >
            {/* Profile card */}
            <div
              data-photo
              className="
          relative isolate mx-auto flex w-full
          max-w-[440px] items-center justify-center
          overflow-hidden rounded-[2rem]
          border border-line2 bg-surface/50
          px-4 py-7
          sm:px-6 sm:py-9
          lg:py-12
        "
            >
              {/* Ambient background */}
              <div
                aria-hidden="true"
                className="
            pointer-events-none absolute inset-0
            bg-[radial-gradient(ellipse_at_50%_40%,rgba(105,87,232,0.13),transparent_65%)]
          "
              />

              {/* Decorative corner details */}
              <div
                aria-hidden="true"
                className="
            pointer-events-none absolute left-5 top-5
            size-8 rounded-tl-xl border-l border-t
            border-accent/30
          "
              />

              <div
                aria-hidden="true"
                className="
            pointer-events-none absolute bottom-5 right-5
            size-8 rounded-br-xl border-b border-r
            border-accent/30
          "
              />

              {photo ? (
                <ProfileCard
                  name={p.name}
                  title={p.role}
                  handle="redatrouki"
                  status={t.contact.available}
                  contactText={t.contact.kicker}
                  avatarUrl={photo}
                  iconUrl="/assets/demo/iconpattern.png"
                  holo={0.55}
                  glare={0.35}
                  tiltStrength={8}
                  parallax={5}
                  radius={18}
                  enableTilt
                  intro
                  showUserInfo
                  enableMobileTilt={false}
                  theme="dark"
                  className="relative z-10 mx-auto w-full"
                />
              ) : (
                <div className="relative z-10 flex aspect-[4/5] w-full max-w-[340px] items-center justify-center rounded-2xl border border-line2 bg-bg">
                  <span className="font-mono text-xs text-muted">
                    {t.about.noPhoto}
                  </span>
                </div>
              )}
            </div>

            {/* About content */}
            <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
              <div className={label} data-reveal>
                01 — {t.about.kicker}
              </div>

              <h2
                data-split
                className="
            max-w-2xl font-hd
            text-[clamp(25px,4vw,38px)]
            font-semibold leading-[1.12]
            tracking-[-0.035em] text-balance
          "
              >
                <SplitWords
                  text={t.about.heading}
                  highlight={t.about.headingHl}
                />
              </h2>

              <div className="flex max-w-2xl flex-col gap-4">
                {paragraphs.map((para, i) => (
                  <p
                    key={i}
                    data-reveal
                    className="
                text-[14px] leading-[1.8]
                text-muted text-pretty
                sm:text-base sm:leading-[1.8]
              "
                  >
                    {para}
                  </p>
                ))}
              </div>

              {/* Personal facts */}
              {facts.length > 0 && (
                <dl
                  data-stagger
                  className="
              m-0 grid grid-cols-2
              gap-2.5 sm:gap-3
            "
                >
                  {facts.map(([k, v]) => (
                    <div
                      key={k}
                      className="
                  min-w-0 rounded-xl
                  border border-line2 bg-surface
                  px-3.5 py-3
                  transition-colors duration-200
                  hover:border-accent/30
                  sm:rounded-2xl sm:px-4 sm:py-3.5
                "
                    >
                      <dt
                        className="
                    font-mono text-[9px]
                    uppercase tracking-[0.1em]
                    text-muted sm:text-[11px]
                  "
                      >
                        {k}
                      </dt>

                      <dd
                        className="
                    m-0 mt-1.5 break-words
                    text-[13px] font-medium
                    sm:text-[15px]
                  "
                      >
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </div>

        {/* Competencies */}
        <div className="overflow-hidden pb-14 sm:pb-20">
          <div
            className={`
        ${wrap} mb-4 flex flex-wrap items-center
        gap-x-2 gap-y-1 font-mono text-[10px]
        text-muted sm:mb-5 sm:text-xs
      `}
          >
            <span>{t.about.competences}</span>
            <span className="text-accent">· {t.about.hint}</span>
          </div>

          {techs.length > 0 && (
            <Marquee className="mb-2.5" speed={45}>
              {fill(techs).map((s, i) => (
                <span
                  key={i}
                  className="
              mr-2.5 inline-flex shrink-0
              items-center gap-2 whitespace-nowrap
              rounded-full border border-line2
              bg-surface px-3.5 py-2.5
              text-[13px] font-medium
              tracking-[-0.01em]
              sm:mr-3 sm:gap-2.5
              sm:px-5 sm:py-3 sm:text-[15px]
            "
                >
                  <i className="size-1.5 shrink-0 rounded-full bg-accent" />
                  {s.name}
                </span>
              ))}
            </Marquee>
          )}

          {practices.length > 0 && (
            <Marquee reverse speed={55}>
              {fill(practices).map((s, i) => (
                <span
                  key={i}
                  className="
              mr-2.5 inline-flex shrink-0
              items-center gap-2 whitespace-nowrap
              rounded-full border border-accent/25
              bg-accent/10 px-3.5 py-2.5
              text-[13px] font-medium
              tracking-[-0.01em] text-accent
              sm:mr-3 sm:gap-2.5
              sm:px-5 sm:py-3 sm:text-[15px]
            "
                >
                  <i className="size-1.5 shrink-0 rounded-full bg-accent" />
                  {s.name}
                </span>
              ))}
            </Marquee>
          )}
        </div>
      </section>


      {/* ---------------- PROJECTS ---------------- */}
      <section id="projects" className="scroll-mt-4 bg-paper text-ink">
        <div className={`${wrap} ${sectionPad}`}>
          <ProjectsSection
            key={locale}
            projects={db.projects.map((x) => ({
              id: x.id, name: tr(x, 'name'), type: tr(x, 'type'), description: tr(x, 'description'),
              stack: splitList(x.stack), image: x.image || '', liveUrl: x.liveUrl, codeUrl: x.codeUrl,
            }))}
          />
        </div>
      </section>

      {/* ---------------- ACADEMIC PATH (diplomas + certifications) ---------------- */}
      <section id="education" className="scroll-mt-4 border-b border-line">
        <div className={`${wrap} ${sectionPad}`}>
          <SectionHead no="03" kicker={t.education.kicker} title={t.education.title} />
          <Academic
            t={t.education}
            degrees={db.education.map((e) => ({ years: tr(e, 'years'), title: tr(e, 'degree'), school: tr(e, 'school'), note: tr(e, 'note') }))}
            certs={db.certifications.map((c) => ({ title: tr(c, 'title'), issuer: tr(c, 'issuer'), date: tr(c, 'date'), credentialId: c.credentialId || '', link: c.link || '', image: c.image || '' }))}
          />
        </div>
      </section>

      {/* ---------------- EXPERIENCE (stacked cards) ---------------- */}
      <section id="experience" className="scroll-mt-4">
        <div>
          <StackedCards head={<SectionHead no="04" kicker={t.experience.kicker} title={t.experience.title} />} tones={['paper', 'surface', 'accent']}>
            {db.experience.map((x, i) => (
              <div key={x.id} className="flex min-h-[320px] flex-col gap-7 p-7 sm:min-h-[360px] sm:p-10">
                <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
                  <div className="flex flex-col gap-2">
                    <div className="font-mono text-xs font-medium uppercase tracking-[0.1em] opacity-70"><bdi>{[tr(x, 'start'), tr(x, 'end')].filter(Boolean).join(' — ')}</bdi></div>
                    <h3 className="font-hd text-[clamp(22px,2.8vw,34px)] font-semibold leading-[1.1] tracking-[-0.03em] text-balance">{tr(x, 'title')}</h3>
                    <div className="text-base opacity-75"><bdi dir="ltr">@ {x.company}</bdi></div>
                  </div>
                  <div aria-hidden="true" className="font-hd text-[clamp(48px,6vw,84px)] font-semibold leading-[0.85] tracking-[-0.05em] opacity-15">{String(i + 1).padStart(2, '0')}</div>
                </div>
                <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 sm:gap-x-8">
                  {splitLines(tr(x, 'summary')).map((b, j) => (
                    <li key={j} className="flex gap-3 text-[15px] leading-[1.6] before:mt-[9px] before:size-1.5 before:shrink-0 before:rounded-full before:bg-current before:content-['']">{b}</li>
                  ))}
                </ul>
                {splitList(x.stack).length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-2">
                    {splitList(x.stack).map((s) => <span key={s} className="rounded-full border border-current/40 px-3 py-1 font-mono text-[11px]">{s}</span>)}
                  </div>
                )}
              </div>
            ))}
          </StackedCards>
        </div>
      </section>

      {/* ---------------- CONTACT ---------------- */}
      <section id="contact" className="scroll-mt-4 px-3 pb-3 sm:px-5">
        <div className="mx-auto grid max-w-[1280px] overflow-hidden rounded-[28px] border border-line2 bg-surface sm:rounded-[40px] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* Left: who / where */}
          <div className="relative flex flex-col gap-6 overflow-hidden bg-accent p-7 text-ink sm:p-12">
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -end-24 size-72 rounded-full border-[28px] border-ink/10" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-8 -end-8 size-40 rounded-full border-[16px] border-ink/10" />
            <div className="font-mono text-xs uppercase tracking-[0.14em]" data-reveal>05 — {t.contact.kicker}</div>
            <h2 data-split className="font-hd text-[clamp(28px,3.4vw,44px)] font-semibold leading-[1.05] tracking-[-0.035em] text-balance">
              <SplitWords text={t.contact.title} />
            </h2>
            <p data-reveal className="max-w-sm text-[15px] leading-relaxed text-ink/75">{t.contact.reply}</p>
            {available && (
              <div data-reveal className="inline-flex items-center gap-2 self-start rounded-full bg-ink/10 px-3.5 py-2 font-mono text-xs">
                <span className="size-2 animate-pulse-soft rounded-full bg-ink" />{t.contact.available}
              </div>
            )}
            {p.email && <CopyEmail email={p.email} />}
            {socials.length > 0 && (
              <div data-reveal className="mt-auto flex flex-col gap-3 pt-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/60">{t.contact.findMe}</div>
                <div className="flex flex-wrap gap-2">
                  {socials.map(([k, v]) => <a key={k} data-magnetic className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink/30 px-4 font-mono text-sm font-medium transition-colors hover:bg-ink hover:text-[#eceae3]" href={v} target="_blank" rel="noopener noreferrer">{k} <span aria-hidden="true">↗</span></a>)}
                </div>
              </div>
            )}
          </div>
          {/* Right: form */}
          <div data-reveal className="p-6 sm:p-12"><ContactForm /></div>
        </div>
      </section>

      <Footer name={p.name} />
    </>
  );
}
