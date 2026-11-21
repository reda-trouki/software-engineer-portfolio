'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);
// Pages opt in to animations with data attributes, so a missing target is normal (e.g. no hero on /blog).
gsap.config({ nullTargetWarn: false });

/**
 * One place for all page animations. Server-rendered markup opts in with
 * data attributes, so pages stay simple:
 *
 *   data-a / data-hero ........ hero items (hidden by CSS, played as a timeline)
 *   data-hero-split ........... headline whose [data-word]s slide up on load
 *   data-split ................ headline whose words slide up on scroll
 *   data-reveal ............... fade + rise on scroll
 *   data-stagger .............. children rise one after another on scroll
 *   data-photo ................ clip-path reveal + parallax image
 *   data-line / data-node ..... timeline rail that draws itself
 *   data-spotlight ............ section whose glow follows the cursor
 *   data-magnetic ............. buttons that lean towards the cursor
 *   data-progress ............. reading-progress bar
 */
export default function Animations() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: reduce)', () => {
      root.classList.add('no-anim');
    });

    mm.add('(prefers-reduced-motion: no-preference), (prefers-reduced-motion: no-preference) and (min-width: 0px)', () => {
      root.classList.remove('no-anim');
      try {
        const $ = <T extends HTMLElement = HTMLElement>(sel: string) => gsap.utils.toArray<T>(sel);

        // ---- hero timeline ----
        const hero = $('[data-hero]');
        const heroWords = $('[data-hero-split] [data-word]');
        if (hero.length || heroWords.length) {
          const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
          tl.fromTo(heroWords, { yPercent: 115, opacity: 1 }, { yPercent: 0, duration: 1.1, stagger: 0.055 }, 0.1);
          tl.fromTo(hero, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.12 }, 0.35);
          tl.fromTo('[data-editor]', { x: 70, y: 20, rotate: 2.5, opacity: 0 }, { x: 0, y: 0, rotate: 0, opacity: 1, duration: 1.1 }, 0.5);
          tl.fromTo('[data-code-line]', { x: -14, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, stagger: 0.07, ease: 'power2.out' }, 0.9);
          tl.fromTo('[data-badge]', { scale: 0, rotate: -200, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 1.1, ease: 'back.out(1.6)' }, 1.0);
        }

        // ---- scroll-triggered headlines ----
        $('[data-split]').forEach((el) => {
          gsap.fromTo(el.querySelectorAll('[data-word]'), { yPercent: 115 }, {
            yPercent: 0, duration: 1, stagger: 0.05, ease: 'power4.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          });
        });

        // ---- fade + rise ----
        $('[data-reveal]').forEach((el) => {
          gsap.fromTo(el, { y: 48, opacity: 0 }, {
            y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          });
        });

        // ---- staggered children ----
        $('[data-stagger]').forEach((el) => {
          gsap.fromTo(el.children, { y: 56, opacity: 0 }, {
            y: 0, opacity: 1, duration: 0.85, stagger: 0.12, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          });
        });

        // ---- photo: clip reveal + parallax ----
        $('[data-photo]').forEach((el) => {
          const img = el.querySelector<HTMLElement>('[data-photo-img]');
          gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, {
            clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power4.inOut',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          });
          if (img) {
            gsap.fromTo(img, { scale: 1.35, yPercent: -6 }, {
              scale: 1.08, yPercent: 6, ease: 'none',
              scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
            });
          }
        });

        // ---- timeline rail ----
        $('[data-line]').forEach((el) => {
          gsap.fromTo(el, { scaleY: 0 }, {
            scaleY: 1, transformOrigin: 'top', ease: 'none',
            scrollTrigger: { trigger: el.parentElement, start: 'top 70%', end: 'bottom 70%', scrub: 0.4 },
          });
        });
        $('[data-node]').forEach((el) => {
          gsap.fromTo(el, { scale: 0, rotate: 0 }, {
            scale: 1, rotate: 45, duration: 0.6, ease: 'back.out(2.4)',
            scrollTrigger: { trigger: el, start: 'top 80%', once: true },
          });
        });

        // ---- reading progress ----
        $('[data-progress]').forEach((el) => {
          gsap.to(el, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } });
        });

        // ---- hero spotlight follows the cursor ----
        $('[data-spotlight]').forEach((el) => {
          el.addEventListener('mousemove', (e: MouseEvent) => {
            const r = el.getBoundingClientRect();
            gsap.to(el, { '--mx': `${e.clientX - r.left}px`, '--my': `${e.clientY - r.top}px`, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
          });
        });

        // ---- magnetic buttons ----
        $('[data-magnetic]').forEach((el) => {
          const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
          const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
          const move = (e: MouseEvent) => {
            const r = el.getBoundingClientRect();
            xTo((e.clientX - (r.left + r.width / 2)) * 0.25);
            yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
          };
          const leave = () => { xTo(0); yTo(0); };
          el.addEventListener('mousemove', move);
          el.addEventListener('mouseleave', leave);
        });

        document.fonts?.ready.then(() => ScrollTrigger.refresh());
      } catch (err) {
        // never leave content hidden if an animation fails
        console.error('Animation setup failed', err);
        root.classList.add('no-anim');
      }
    });

    return () => mm.revert();
  }, [pathname]);

  // Next skips its scroll-to-top when the new page starts with a sticky element (our nav),
  // so do it ourselves: new page -> top, "/#id" -> that section. Back/forward keep their position.
  const popped = useRef(false);
  const first = useRef(true);
  useEffect(() => {
    const onPop = () => { popped.current = true; };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const wasFirst = first.current;
    first.current = false;
    const wasPop = popped.current;
    popped.current = false;
    const go = (fn: () => void) => {
      const prev = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      fn();
      root.style.scrollBehavior = prev;
    };
    const timers: number[] = [];
    const hash = window.location.hash;
    if (hash.length > 1 && !wasPop) {
      const toHash = () => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' });
      // pinned sections and fonts shift the layout, so re-aim a couple of times
      [0, 400, 1000].forEach((ms) => timers.push(window.setTimeout(() => go(toHash), ms)));
    } else if (!wasFirst && !wasPop && window.scrollY > 0) {
      go(() => window.scrollTo(0, 0));
    }
    return () => timers.forEach(clearTimeout);
  }, [pathname]);

  return null;
}
