'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Children, useEffect, useRef, type ReactNode } from 'react';

gsap.registerPlugin(ScrollTrigger);

export type Tone = 'surface' | 'paper' | 'accent';

const TONES: Record<Tone, string> = {
  surface: 'bg-surface text-fg border-line2',
  paper: 'bg-paper text-ink border-ink/10',
  accent: 'bg-accent text-ink border-ink/10',
};

/**
 * Sticky-section card stack (like the iPhone product pages).
 * The whole section pins to the viewport; as you keep scrolling, each next card
 * slides up from the bottom and lands ON TOP of the previous one, which shrinks
 * and dims behind it. Without JS / with reduced motion the cards are a plain list.
 */
export default function StackedCards({ head, children, tones = ['surface', 'paper', 'accent'] }: { head?: ReactNode; children: ReactNode; tones?: Tone[] }) {
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cards = Children.toArray(children);

  useEffect(() => {
    const pin = pinRef.current, stage = stageRef.current;
    if (!pin || !stage || cards.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    stage.dataset.pin = 'on';
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>('[data-stack-card]', stage);
      const STEP = 0.9; // viewport-heights of scrolling per card

      gsap.set(items.slice(1), { yPercent: 130 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: () => `+=${(items.length - 1) * STEP * window.innerHeight}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      items.slice(1).forEach((card, k) => {
        const prev = items[k];
        const at = k; // one unit of timeline per card
        tl.to(card, { yPercent: 0, duration: 1, ease: 'power2.out' }, at)
          .to(prev.querySelector('[data-stack-inner]'), { scale: 0.93, yPercent: -3, duration: 1 }, at)
          .to(prev.querySelector('[data-stack-dim]'), { opacity: 0.55, duration: 1 }, at);
      });

      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    }, pin);

    return () => { ctx.revert(); delete stage.dataset.pin; };
  }, [cards.length]);

  return (
    <div ref={pinRef} className="mx-auto flex w-full max-w-280 flex-col justify-center px-5 py-16 sm:px-8 sm:py-24 [@media(min-width:640px)_and_(min-height:760px)]:min-h-screen">
      {head}
      <div ref={stageRef} className="stack-stage grid gap-5">
        {cards.map((card, i) => (
          <div key={i} data-stack-card className="relative self-start" style={{ zIndex: i + 1 }}>
            <div
              data-stack-inner
              className={`relative origin-top overflow-hidden rounded-[28px] border shadow-[0_-16px_50px_rgba(0,0,0,0.4)] will-change-transform ${TONES[tones[i % tones.length]]}`}
            >
              {card}
              <div data-stack-dim aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black opacity-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
