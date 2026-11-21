'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

/** A number that counts up from 0 when it scrolls into view. Server-rendered with the final value. */
export default function CountUp({ to, className = '' }: { to: number; className?: string }) {
  const el = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = el.current;
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const state = { v: 0 };
    node.textContent = '0';
    const tween = gsap.to(state, {
      v: to, duration: 1.4, ease: 'power3.out', paused: true,
      onUpdate: () => { node.textContent = String(Math.round(state.v)); },
    });
    const st = ScrollTrigger.create({ trigger: node, start: 'top 90%', once: true, onEnter: () => { tween.play(); } });
    return () => { st.kill(); tween.kill(); node.textContent = String(to); };
  }, [to]);

  return <span ref={el} className={className}>{to}</span>;
}
