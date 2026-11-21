'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, type RefObject } from 'react';

gsap.registerPlugin(ScrollTrigger);

/** Cards rise in as they scroll into view, and replay whenever `key` changes (filters). */
export function useStaggerIn(ref: RefObject<HTMLElement | null>, key: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      const kids = Array.from(el.children) as HTMLElement[];
      if (!kids.length) return;
      gsap.set(kids, { y: 50, opacity: 0 });
      ScrollTrigger.batch(kids, {
        start: 'top 92%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out', overwrite: true }),
      });
      ScrollTrigger.refresh();
    }, el);
    return () => ctx.revert();
  }, [ref, key]);
}
