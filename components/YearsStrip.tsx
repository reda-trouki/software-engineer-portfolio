
'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useId, useRef, useState } from 'react';
import CountUp from './CountUp';

gsap.registerPlugin(ScrollTrigger);

export interface Bar {
  label: string;
  sub: string;
  start: number;
  end: number;
  note?: string;
}

export interface Dot {
  label: string;
  year: number;
  issuer?: string;
  date?: string;
  credentialId?: string;
}

export interface Stat {
  n: number;
  label: string;
}

/* ─────────────────────────────────────────────
   Tooltip
───────────────────────────────────────────── */

function Tooltip({
  type,
  title,
  subtitle,
  date,
  note,
  credentialId,
  mobile = false,
}: {
  type: string;
  title: string;
  subtitle?: string;
  date: string;
  note?: string;
  credentialId?: string;
  mobile?: boolean;
}) {
  return (
    <div
      role="tooltip"
      className={`
        relative rounded-xl border border-line2
        bg-surface p-3.5 text-left shadow-xl
        transition-all duration-200
        ${
          mobile
            ? 'pointer-events-auto w-full max-w-none translate-y-0 opacity-100 shadow-sm'
            : `
              pointer-events-none
              w-[260px] max-w-[calc(100vw-48px)]
              -translate-y-1.5 opacity-0
              group-hover:translate-y-0
              group-hover:opacity-100
              group-focus-visible:translate-y-0
              group-focus-visible:opacity-100
              group-data-[active=true]:translate-y-0
              group-data-[active=true]:opacity-100
            `
        }
      `}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="
            rounded-md border border-accent/20
            bg-accent/10 px-2 py-1
            font-mono text-[9px] font-semibold
            uppercase tracking-wider text-accent
          "
        >
          {type}
        </span>

        <span
          className="
            shrink-0 font-mono text-[10px]
            tabular-nums text-muted
          "
        >
          {date}
        </span>
      </div>

      <h4
        className="
          mt-2.5 break-words font-hd
          text-[13px] font-semibold
          leading-snug text-fg
        "
      >
        {title}
      </h4>

      {subtitle && (
        <p className="mt-1 break-words text-[11px] leading-relaxed text-muted">
          {subtitle}
        </p>
      )}

      {note && (
        <p
          className="
            mt-2 border-t border-line2 pt-2
            text-[11px] leading-relaxed text-muted
          "
        >
          {note}
        </p>
      )}

      {credentialId && (
        <p
          dir="ltr"
          className="
            mt-2 break-all border-t border-line2
            pt-2 font-mono text-[9px] text-muted
          "
        >
          ID: {credentialId}
        </p>
      )}

      {!mobile && (
        <span
          aria-hidden="true"
          className="
            absolute -bottom-1.5 left-1/2
            size-3 -translate-x-1/2 rotate-45
            border-b border-r border-line2 bg-surface
          "
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Timeline
───────────────────────────────────────────── */

export default function YearsStrip({
  title,
  bars,
  dots,
  stats,
  dotsLabel,
}: {
  title: string;
  bars: Bar[];
  dots: Dot[];
  stats: Stat[];
  dotsLabel: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const instanceId = useId();

  const [active, setActive] = useState<string | null>(null);

  const all = [
    ...bars.flatMap((b) => [b.start, b.end]),
    ...dots.map((d) => d.year),
  ];

  const lo = Math.floor(Math.min(...all));
  const hi = Math.max(Math.ceil(Math.max(...all)), lo + 1);

  const pct = (v: number) =>
    ((v - lo) / (hi - lo)) * 100;

  const step = Math.max(1, Math.ceil((hi - lo) / 8));
  const ticks: number[] = [];

  for (let y = lo; y <= hi; y += step) {
    ticks.push(y);
  }

  const toggle = (key: string) => {
    setActive((current) => (current === key ? null : key));
  };

  // Resolve the currently selected milestone for mobile.
  const activeIndex = active
    ? Number(active.split('-')[1])
    : -1;

  const activeBar =
    active?.startsWith('degree-') && bars[activeIndex]
      ? bars[activeIndex]
      : null;

  const activeDot =
    active?.startsWith('cert-') && dots[activeIndex]
      ? dots[activeIndex]
      : null;

  useEffect(() => {
    const el = root.current;

    if (
      !el ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          once: true,
        },
      });

      // only animate what exists (e.g. no certification dots when there are none)
      const has = (sel: string) => el.querySelector(sel) !== null;

      if (has('[data-bar]')) {
        tl.fromTo(
          '[data-bar]',
          { scaleX: 0 },
          { scaleX: 1, transformOrigin: 'left center', duration: 1.1, stagger: 0.18, ease: 'power3.out' },
        );
      }
      if (has('[data-dot]')) {
        tl.fromTo(
          '[data-dot]',
          { scale: 0 },
          { scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(2.5)' },
          '-=0.5',
        );
      }
      if (has('[data-bar-text]')) {
        tl.fromTo(
          '[data-bar-text]',
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out' },
          0.3,
        );
      }
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={root}
      className="
        relative min-w-0 rounded-[24px]
        border border-line2 bg-surface
        sm:rounded-[28px]
      "
      dir="ltr"
      onPointerDown={(e) => {
        if (e.pointerType === 'touch') return;

        if (!(e.target as HTMLElement).closest('[data-milestone]')) {
          setActive(null);
        }
      }}
    >
      {/* Header */}
      <div
        className="
          flex flex-col gap-4
          border-b border-line2
          px-4 py-4
          sm:flex-row sm:flex-wrap
          sm:items-center sm:justify-between
          sm:gap-5 sm:px-8 sm:py-5
        "
      >
        <div
          className="
            font-mono text-[10px] uppercase
            tracking-[0.14em] text-muted
            sm:text-[11px]
          "
        >
          {title}
        </div>

        <dl className="flex flex-wrap gap-x-5 gap-y-3 sm:gap-x-7">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-baseline gap-1.5 sm:gap-2"
            >
              <dd
                className="
                  font-hd text-xl font-semibold
                  leading-none tracking-[-0.02em]
                  text-accent sm:text-2xl
                "
              >
                <CountUp to={s.n} />
              </dd>

              <dt className="font-mono text-[10px] text-muted sm:text-[11px]">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>

      {/* Timeline */}
      <div className="relative px-4 pb-5 pt-7 sm:px-8 sm:pb-6 sm:pt-8">

        {/* Year grid */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-y-0
            start-4 end-4 sm:start-8 sm:end-8
          "
        >
          {ticks.map((y) => (
            <i
              key={y}
              className="absolute inset-y-0 w-px bg-line"
              style={{ left: `${pct(y)}%` }}
            />
          ))}
        </div>

        <div className="relative flex flex-col gap-7 sm:gap-8">

          {/* Education bars */}
          {bars.map((b, i) => {
            const key = `degree-${i}`;
            const left = pct(b.start);
            const width = Math.max(pct(b.end) - left, 2);
            const center = Math.max(
              18,
              Math.min(82, left + width / 2),
            );

            const date =
              b.start === b.end
                ? `${Math.floor(b.start)}`
                : `${Math.floor(b.start)} – ${Math.ceil(b.end)}`;

            return (
              <div
                key={key}
                className="relative flex flex-col gap-2.5"
              >
                <div
                  data-bar-text
                  dir="auto"
                  className="
                    flex flex-wrap items-baseline
                    gap-x-3 gap-y-1
                  "
                >
                  <b
                    className="
                      break-words font-hd
                      text-[14px] font-semibold
                      tracking-[-0.01em]
                      sm:text-[15px]
                    "
                  >
                    {b.label}
                  </b>

                  <span className="break-words text-[11px] text-muted sm:text-[13px]">
                    {b.sub}
                  </span>
                </div>

                <div className="relative h-9 sm:h-8">
                  <button
                    type="button"
                    data-milestone
                    data-active={active === key}
                    aria-label={`${b.label}, ${b.sub}, ${date}`}
                    aria-describedby={`${instanceId}-${key}`}
                    aria-controls={`${instanceId}-mobile-detail`}
                    aria-expanded={active === key}
                    onClick={() => toggle(key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setActive(null);
                      }
                    }}
                    className="
                      group absolute inset-y-0 z-10
                      cursor-pointer rounded-full
                      outline-none
                      focus-visible:ring-2
                      focus-visible:ring-accent
                      focus-visible:ring-offset-2
                    "
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      minWidth: '28px',
                    }}
                  >
                    {/* Actual bar */}
                    <span
                      data-bar
                      className="
                        absolute inset-y-2 left-0 right-0
                        rounded-full bg-gradient-to-r
                        from-accent to-accent/60
                        shadow-[0_0_30px_-4px_color-mix(in_srgb,var(--accent)_60%,transparent)]
                        transition-all duration-200
                        group-hover:brightness-110
                        group-hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_35%,transparent)]
                        group-data-[active=true]:brightness-125
                      "
                    />

                    {/* Desktop tooltip */}
                    <div
                      id={`${instanceId}-${key}`}
                      style={{ left: `${center}%` }}
                      className="
                        pointer-events-none absolute
                        bottom-full z-50 mb-1
                        hidden -translate-x-1/2 sm:block
                      "
                    >
                      <Tooltip
                        type="Education"
                        title={b.label}
                        subtitle={b.sub}
                        date={date}
                        note={b.note}
                      />
                    </div>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Certifications */}
          {dots.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <div
                data-bar-text
                className="
                  font-hd text-[14px]
                  font-semibold tracking-[-0.01em]
                  sm:text-[15px]
                "
              >
                {dotsLabel}
              </div>

              <div className="relative h-9 sm:h-8">
                <span
                  aria-hidden="true"
                  className="
                    absolute inset-x-0 top-1/2
                    h-px bg-line2
                  "
                />

                {dots.map((d, i) => {
                  const key = `cert-${i}`;
                  const position = pct(d.year);
                  const center = Math.max(
                    18,
                    Math.min(82, position),
                  );

                  return (
                    <button
                      key={key}
                      type="button"
                      data-milestone
                      data-active={active === key}
                      aria-label={`${d.label}, ${d.issuer ?? dotsLabel}, ${d.date ?? Math.floor(d.year)}`}
                      aria-describedby={`${instanceId}-${key}`}
                      aria-controls={`${instanceId}-mobile-detail`}
                      aria-expanded={active === key}
                      onClick={() => toggle(key)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setActive(null);
                        }
                      }}
                      className="
                        group absolute top-1/2 z-10
                        grid size-9 -translate-x-1/2
                        -translate-y-1/2
                        place-items-center rounded-full
                        cursor-pointer outline-none
                        focus-visible:ring-2
                        focus-visible:ring-accent
                        focus-visible:ring-offset-2
                        sm:size-8
                      "
                      style={{ left: `${position}%` }}
                    >
                      {/* Dot */}
                      <span
                        data-dot
                        className="
                          size-3 rounded-full
                          border-2 border-accent
                          bg-surface
                          transition-all duration-200
                          group-hover:scale-125
                          group-hover:bg-accent
                          group-data-[active=true]:scale-125
                          group-data-[active=true]:bg-accent
                          group-data-[active=true]:shadow-[0_0_14px_var(--accent)]
                        "
                      />

                      {/* Desktop tooltip */}
                      <div
                        id={`${instanceId}-${key}`}
                        style={{ left: `${center - position}%` }}
                        className="
                          pointer-events-none absolute
                          bottom-full z-50 mb-1
                          hidden -translate-x-1/2 sm:block
                        "
                      >
                        <Tooltip
                          type="Certification"
                          title={d.label}
                          subtitle={d.issuer}
                          date={d.date ?? String(Math.floor(d.year))}
                          credentialId={d.credentialId}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Mobile milestone detail panel */}
        {active && (activeBar || activeDot) && (
          <div
            id={`${instanceId}-mobile-detail`}
            role="region"
            aria-label="Milestone details"
            className="
              mt-5 overflow-hidden rounded-xl
              border border-line2 bg-bg
              p-3.5 sm:hidden
            "
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[10px] font-medium text-muted">
                {activeBar ? 'Education details' : 'Certification details'}
              </span>

              <button
                type="button"
                onClick={() => setActive(null)}
                aria-label="Close details"
                className="
                  grid size-8 shrink-0 place-items-center
                  rounded-lg border border-line2
                  text-muted transition-colors
                  hover:bg-surface hover:text-fg
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-accent
                "
              >
                <svg
                  aria-hidden="true"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {activeBar && (
              <Tooltip
                mobile
                type="Education"
                title={activeBar.label}
                subtitle={activeBar.sub}
                date={
                  activeBar.start === activeBar.end
                    ? `${Math.floor(activeBar.start)}`
                    : `${Math.floor(activeBar.start)} – ${Math.ceil(activeBar.end)}`
                }
                note={activeBar.note}
              />
            )}

            {activeDot && (
              <Tooltip
                mobile
                type="Certification"
                title={activeDot.label}
                subtitle={activeDot.issuer}
                date={
                  activeDot.date ??
                  String(Math.floor(activeDot.year))
                }
                credentialId={activeDot.credentialId}
              />
            )}
          </div>
        )}

        {/* Year axis */}
        <div
          aria-hidden="true"
          className="
            relative mt-6 h-5 border-t
            border-line2 pt-2 font-mono
            text-[9px] text-muted
            sm:text-[11px]
          "
        >
          {ticks.map((y) => (
            <span
              key={y}
              className={`
                absolute
                ${
                  y === lo
                    ? 'translate-x-0'
                    : y === hi
                      ? '-translate-x-full'
                      : '-translate-x-1/2'
                }
              `}
              style={{ left: `${pct(y)}%` }}
            >
              {y}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
