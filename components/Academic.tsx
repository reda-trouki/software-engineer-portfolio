
import { initials } from '@/lib/format';
import type { Dict } from '@/lib/i18n';
import YearsStrip, { type Bar, type Dot } from './YearsStrip';
import {
  AcademicCapIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/16/solid';

export interface Degree {
  years: string;
  title: string;
  school: string;
  note: string;
}

export interface Cert {
  title: string;
  issuer: string;
  date: string;
  credentialId: string;
  link: string;
  image: string;
}

const yearsIn = (s: string) =>
  (s.match(/\b(19|20)\d{2}\b/g) ?? []).map(Number);

/* ─────────────────────────────────────────────
   Academic degree card
───────────────────────────────────────────── */

function DegreeCard({ d }: { d: Degree }) {
  return (
    <article
      data-reveal
      className="
        group flex min-w-0 items-start gap-3
        border-b border-line2 py-4 last:border-0
        sm:gap-4 sm:py-5
      "
    >
      {/* Icon */}
      <div
        className="
          grid size-9 shrink-0 place-items-center
          rounded-xl border border-line2 bg-bg
          text-accent transition-colors duration-200
          group-hover:border-accent/30
          group-hover:bg-accent/5
          sm:size-10
        "
      >
        <AcademicCapIcon className="size-5 sm:size-6" />
      </div>

      {/* Information */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <h4
            className="
              min-w-0 flex-1 break-words
              font-hd text-[14px] font-semibold
              leading-snug tracking-[-0.02em]
              transition-colors group-hover:text-accent
              sm:text-[15px]
            "
          >
            {d.title}
          </h4>

          {d.years && (
            <span
              dir="auto"
              className="
                shrink-0 rounded-md border border-line2
                bg-bg px-2 py-1
                font-mono text-[10px]
                tabular-nums text-muted
              "
            >
              {d.years}
            </span>
          )}
        </div>

        <p className="mt-1.5 break-words text-[12px] leading-relaxed text-muted sm:text-[13px]">
          {d.school}
        </p>

        {d.note && (
          <p
            className="
              mt-2 max-w-2xl break-words
              text-[12px] leading-[1.75]
              text-muted/80 sm:text-[13px]
            "
          >
            {d.note}
          </p>
        )}
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────
   Certification row
───────────────────────────────────────────── */

function CertRow({
  c,
  t,
}: {
  c: Cert;
  t: Dict['education'];
}) {
  return (
    <li
      className="
        group flex min-w-0 items-start gap-3
        px-3 py-3.5 transition-colors duration-200
        hover:bg-bg/50 active:bg-bg/70
        sm:items-center sm:px-5 sm:py-4
      "
    >
      {/* Issuer logo */}
      {c.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={c.image}
          alt=""
          loading="lazy"
          className="
            size-9 shrink-0 rounded-lg
            border border-line2 bg-bg
            object-contain p-1.5
            sm:size-10
          "
        />
      ) : (
        <span
          aria-hidden="true"
          className="
            grid size-9 shrink-0 place-items-center
            rounded-lg border border-line2 bg-bg
            font-mono text-xs font-semibold text-accent
            sm:size-10
          "
        >
          {initials(c.issuer)}
        </span>
      )}

      {/* Certification details */}
      <div className="min-w-0 flex-1">
        <h4
          className="
            line-clamp-2 break-words
            font-hd text-[12px] font-semibold
            leading-snug tracking-[-0.01em]
            transition-colors group-hover:text-accent
            sm:text-[13px]
          "
          title={c.title}
        >
          {c.title}
        </h4>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] text-muted sm:text-[11px]">
          <span className="break-words">{c.issuer}</span>

          {c.date && (
            <>
              <span aria-hidden="true">·</span>
              <span dir="auto" className="shrink-0">
                {c.date}
              </span>
            </>
          )}
        </div>

        {/* Credential ID */}
        {c.credentialId && (
          <p
            dir="ltr"
            title={c.credentialId}
            className="
              mt-1 hidden max-w-full truncate
              font-mono text-[10px] text-muted/70
              sm:block lg:max-w-32
            "
          >
            ID: {c.credentialId}
          </p>
        )}
      </div>

      {/* Verify action */}
      {c.link && (
        <a
          href={c.link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t.verify}: ${c.title}`}
          title={t.verify}
          className="
            grid size-9 shrink-0 place-items-center
            rounded-xl border border-transparent
            text-muted transition-all duration-200
            hover:border-accent/20 hover:bg-accent/10
            hover:text-accent
            focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-accent
          "
        >
          <ArrowTopRightOnSquareIcon className="size-5" />
        </a>
      )}
    </li>
  );
}

/* ─────────────────────────────────────────────
   Section heading
───────────────────────────────────────────── */

function SectionHeading({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <h3
        className="
          font-hd text-base font-semibold
          tracking-[-0.025em]
        "
      >
        {title}
      </h3>

      <span className="font-mono text-[10px] tabular-nums text-muted">
        {String(count).padStart(2, '0')}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Certifications section
───────────────────────────────────────────── */

function Certifications({
  certs,
  t,
}: {
  certs: Cert[];
  t: Dict['education'];
}) {
  return (
    <section
      data-reveal
      aria-label={t.certsTitle}
      className="
        min-w-0 overflow-hidden rounded-2xl
        border border-line2 bg-surface
        shadow-sm shadow-ink/[0.02]
      "
    >
      {/* Header */}
      <div
        className="
          flex items-center justify-between gap-3
          border-b border-line2 px-3.5 py-3.5
          sm:px-5 sm:py-4
        "
      >
        <div className="min-w-0">
          <h3
            className="
              font-hd text-base font-semibold
              tracking-[-0.025em]
            "
          >
            {t.certsTitle}
          </h3>

          <p className="mt-0.5 text-[11px] text-muted">
            {t.certsSub}
          </p>
        </div>

        <span
          className="
            shrink-0 rounded-lg border border-line2 bg-bg
            px-2.5 py-1 font-mono text-[10px]
            tabular-nums text-muted
          "
        >
          {String(certs.length).padStart(2, '0')}
        </span>
      </div>

      {/* List */}
      {certs.length > 0 ? (
        <ul className="divide-y divide-line2">
          {certs.map((c, i) => (
            <CertRow
              key={`${c.title}-${i}`}
              c={c}
              t={t}
            />
          ))}
        </ul>
      ) : (
        <div
          className="
            flex flex-col items-center
            justify-center px-5 py-9 text-center
          "
        >
          <span
            className="
              mb-3 grid size-10 place-items-center
              rounded-xl border border-line2
              bg-bg text-muted
            "
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </span>

          <p className="text-xs text-muted">{t.none}</p>
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────
   Academic section
───────────────────────────────────────────── */

export default function Academic({
  degrees,
  certs,
  t,
}: {
  degrees: Degree[];
  certs: Cert[];
  t: Dict['education'];
}) {
  // Original timeline calculations — unchanged.
  const bars: Bar[] = degrees.flatMap((d) => {
    const ys = yearsIn(d.years);
    if (!ys.length) return [];

    const start = Math.min(...ys);
    const end = Math.max(...ys);

    return [
      {
        label: d.title,
        sub: d.school,
        start,
        end: end === start ? start + 0.6 : end,
        note: d.note,
      },
    ];
  });

  const dots: Dot[] = certs.flatMap((c) => {
    const y = yearsIn(c.date)[0];

    return y
      ? [
          {
            label: c.title,
            year: y + 0.5,
            issuer: c.issuer,
            date: c.date,
            credentialId: c.credentialId,
          },
        ]
      : [];
  });

  const all = bars.flatMap((b) => [b.start, b.end]);

  const span =
    all.length > 1
      ? Math.round(Math.max(...all) - Math.min(...all))
      : 0;

  const stats = [
    { n: degrees.length, label: t.degrees },
    { n: certs.length, label: t.certs },
    ...(span > 0 ? [{ n: span, label: t.years }] : []),
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6 sm:gap-8">
      {/* Timeline — original calculations and component preserved */}
      {bars.length > 0 && (
        <div data-reveal className="min-w-0">
          <YearsStrip
            title={t.timeline}
            bars={bars}
            dots={dots}
            stats={stats}
            dotsLabel={t.certs}
          />
        </div>
      )}

      {/* Education and certifications */}
      {(degrees.length > 0 || certs.length > 0) && (
        <div
          className="
            grid min-w-0 grid-cols-1 items-start
            gap-7 sm:gap-8
            lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]
            lg:gap-10
          "
        >
          {/* Academic degrees */}
          {degrees.length > 0 && (
            <section
              aria-label={t.degrees}
              className="min-w-0"
            >
              <SectionHeading
                title={t.degrees}
                count={degrees.length}
              />

              <div className="border-t border-line2">
                {degrees.map((d, i) => (
                  <DegreeCard
                    key={`${d.title}-${i}`}
                    d={d}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {certs.length > 0 && (
            <Certifications
              certs={certs}
              t={t}
            />
          )}
        </div>
      )}
    </div>
  );
}
