'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, type ReactNode } from 'react';

gsap.registerPlugin(ScrollTrigger);

/**
 * Infinite loop that reacts to scrolling: it speeds up with scroll velocity and
 * reverses when you scroll back up. Slows down while hovered.
 * Children must use margin-right (not gap) so the two copies join seamlessly.
 */
export default function Marquee({
  children, speed = 60, reverse = false, className = '',
}: { children: ReactNode; speed?: number; reverse?: boolean; className?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const group = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = track.current, g = group.current;
    if (!t || !g) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let width = g.offsetWidth;
    let x = 0, boost = 1, boostTarget = 1, dir = 1, dirSmooth = 1, hover = 1, hoverTarget = 1;
    const sign = reverse ? 1 : -1;

    const ro = new ResizeObserver(() => { width = g.offsetWidth; });
    ro.observe(g);

    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        boostTarget = 1 + Math.min(Math.abs(self.getVelocity()) / 180, 9);
        dir = self.direction;
      },
    });

    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs, 64) / 1000;
      boostTarget += (1 - boostTarget) * 0.04;
      boost += (boostTarget - boost) * 0.1;
      dirSmooth += (dir - dirSmooth) * 0.08;
      hover += (hoverTarget - hover) * 0.08;
      x += sign * speed * boost * dirSmooth * hover * dt;
      if (width) x = gsap.utils.wrap(-width, 0, x);
      t.style.transform = `translate3d(${x}px,0,0)`;
    };
    gsap.ticker.add(tick);

    const slow = () => { hoverTarget = 0.15; };
    const fast = () => { hoverTarget = 1; };
    t.addEventListener('mouseenter', slow);
    t.addEventListener('mouseleave', fast);

    return () => {
      gsap.ticker.remove(tick);
      st.kill();
      ro.disconnect();
      t.removeEventListener('mouseenter', slow);
      t.removeEventListener('mouseleave', fast);
    };
  }, [speed, reverse]);

  return (
    <div dir="ltr" className={`loop-mask overflow-hidden ${className}`}>
      <div ref={track} className="flex w-max will-change-transform">
        <div ref={group} className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}
