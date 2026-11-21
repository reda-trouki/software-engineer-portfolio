'use client';

import gsap from 'gsap';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';

const MIN = 4;
const MAX = 8;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Verification-code style PIN entry: one box per digit, paste and mobile one-time-code friendly. */
export default function PinGate() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [focused, setFocused] = useState(true);
  const card = useRef<HTMLDivElement>(null);
  const boxes = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const count = Math.min(MAX, Math.max(MIN, pin.length >= MIN ? pin.length + 1 : MIN));

  useEffect(() => {
    input.current?.focus();
    if (reduced() || !card.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(card.current, { y: 36, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' });
      gsap.fromTo('[data-box]', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, delay: 0.3, ease: 'power3.out' });
    }, card);
    return () => ctx.revert();
  }, []);

  // keep the keyboard ready after every attempt
  useEffect(() => { if (!busy && !ok) input.current?.focus(); }, [busy, ok]);

  function onChange(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, MAX);
    setError('');
    setPin(digits);
    if (digits.length > pin.length && !reduced()) {
      // pop the box that was just filled
      requestAnimationFrame(() => {
        const el = boxes.current?.querySelectorAll('[data-box]')[digits.length - 1];
        if (el) gsap.fromTo(el, { scale: 0.86 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' });
      });
    }
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (busy || ok || pin.length < MIN) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
      if (res.ok) {
        setOk(true);
        if (!reduced() && boxes.current) gsap.fromTo(boxes.current.querySelectorAll('[data-box]'), { y: 0 }, { y: -8, duration: 0.25, stagger: 0.04, yoyo: true, repeat: 1, ease: 'power2.out' });
        setTimeout(() => router.refresh(), reduced() ? 0 : 700);
        return;
      }
      const j = await res.json().catch(() => ({}));
      setError(j.error || 'Could not sign in.');
      setPin('');
      if (!reduced() && boxes.current) gsap.fromTo(boxes.current, { x: -14 }, { x: 0, duration: 0.6, ease: 'elastic.out(1.2, 0.25)' });
      input.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  const state = ok ? 'ok' : error ? 'err' : 'idle';
  const boxCls: Record<string, string> = {
    idle: 'border-line2 bg-bg',
    err: 'border-warn bg-warn/5',
    ok: 'border-accent bg-accent/15',
  };

  return (
    <main dir="ltr" lang="en" className="spotlight flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-[18px] sm:px-8">
        <Link href="/" className="flex min-h-11 items-center gap-2.5 font-mono text-base font-medium"><span className="size-3 rounded-[3px] bg-accent" />Portfolio</Link>
        <Link href="/" className="flex min-h-11 items-center font-mono text-sm text-muted hover:text-fg">← Back to site</Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 pb-20 pt-6">
        <div ref={card} className="flex w-full max-w-[440px] flex-col items-center gap-7 rounded-[32px] border border-line2 bg-surface/90 px-6 py-10 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)] backdrop-blur sm:px-10">
          <div className="relative grid size-16 place-items-center rounded-2xl border border-line2 bg-bg text-accent">
            <span aria-hidden="true" className="absolute inset-0 -z-10 rounded-2xl bg-accent/20 blur-xl" />
            {ok ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4 10-10" /></svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2.5" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
            )}
          </div>

          <div className="flex flex-col gap-2 text-center">
            <h1 className="font-hd text-[26px] font-semibold leading-[1.15] tracking-[-0.03em]">{ok ? 'Welcome back' : 'Enter your PIN'}</h1>
            <p className="text-[15px] leading-normal text-muted">{ok ? 'Opening the control panel…' : `Type the ${MIN} to ${MAX} digit PIN to open the control panel.`}</p>
          </div>

          <form onSubmit={submit} className="flex w-full flex-col items-center gap-6">
            <div ref={boxes} className="relative" onClick={() => input.current?.focus()}>
              <div className="flex justify-center gap-2.5 sm:gap-3">
                {Array.from({ length: count }).map((_, i) => {
                  const filled = i < pin.length;
                  const active = focused && !busy && !ok && i === Math.min(pin.length, count - 1);
                  return (
                    <div
                      key={i} data-box
                      className={`relative grid h-14 w-11 place-items-center rounded-2xl border-2 font-mono text-2xl font-semibold transition-colors duration-200 sm:h-16 sm:w-12 ${boxCls[state]} ${active ? '!border-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_18%,transparent)]' : ''}`}
                    >
                      {filled ? (reveal ? pin[i] : <span className="size-3 rounded-full bg-current" />) : active ? <span className="animate-blink h-6 w-0.5 bg-accent" /> : null}
                    </div>
                  );
                })}
              </div>
              {/* the real input: handles typing, paste, SMS/one-time-code autofill and mobile keyboards */}
              <input
                ref={input} value={pin} onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void submit(); } }}
                inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={MAX} aria-label="PIN" readOnly={busy || ok}
                className="absolute inset-0 h-full w-full cursor-text opacity-0"
              />
            </div>

            <div role="alert" className="-mt-2 min-h-5 text-center font-mono text-[13px] text-warn">{error}</div>

            <button type="submit" disabled={pin.length < MIN || busy || ok} className="min-h-13 w-full cursor-pointer rounded-full bg-accent px-6 text-[15px] font-medium text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
              {ok ? 'Verified' : busy ? 'Verifying…' : 'Verify PIN'}
            </button>

            <button type="button" onClick={() => { setReveal((r) => !r); input.current?.focus(); }} className="cursor-pointer font-mono text-xs text-muted transition-colors hover:text-fg">
              {reveal ? 'Hide digits' : 'Show digits'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
