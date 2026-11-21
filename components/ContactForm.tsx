
'use client';

import { useRef, useState, type FormEvent } from 'react';
import { btnPrimary } from '@/lib/ui';
import { useI18n } from './I18nProvider';
import { CheckBadgeIcon } from '@heroicons/react/16/solid';

type FormState = 'idle' | 'sending' | 'sent';

const fieldClass = [
  'min-h-[52px] w-full rounded-xl border border-line2',
  'bg-bg px-4 py-3 text-base text-fg',
  'placeholder:text-soft',
  'outline-none transition-all duration-200',
  'hover:border-hl',
  'focus:border-accent focus:ring-4 focus:ring-accent/15',
  'disabled:cursor-not-allowed disabled:opacity-60',
].join(' ');

const labelClass = 'font-mono text-[12px] tracking-wide text-muted';

export default function ContactForm() {
  const { t } = useI18n();

  const [state, setState] = useState<FormState>('idle');
  const [error, setError] = useState('');
  const [topic, setTopic] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (state === 'sending') return;

    const form = e.currentTarget;
    const data = Object.fromEntries(
      new FormData(form),
    ) as Record<string, string>;

    if (topic !== null) data.message = `[${t.contact.topics[topic]}] ${data.message}`;

    setState('sending');
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.error || t.contact.error);
      }

      setState('sent');

      requestAnimationFrame(() => {
        successRef.current?.focus();
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.contact.error,
      );
      setState('idle');
    }
  }

  function resetForm() {
    formRef.current?.reset();
    setError('');
    setTopic(null);
    setCount(0);
    setState('idle');
  }

  if (state === 'sent') {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="relative flex h-full flex-col justify-center overflow-hidden outline-none"
      >
        <div className="mb-6 flex size-14 animate-[pop_.5s_cubic-bezier(.34,1.56,.64,1)_both] items-center justify-center rounded-full bg-accent text-ink">
         <CheckBadgeIcon className='size-7' />
        </div>

        <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-muted">
          {t.contact.sentKicker}
        </p>

        <h3 className="font-hd text-2xl font-semibold text-fg sm:text-3xl">
          {t.contact.sentTitle}
        </h3>

        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
          {t.contact.sentBody}
        </p>

        <button
          type="button"
          onClick={resetForm}
          className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line2 px-5 text-sm font-medium text-fg transition-colors hover:bg-line focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20"
        >
          {t.contact.another}
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="flex flex-col gap-6"
    >
      {/* Honeypot field */}
      <div
        className="absolute -start-[9999px] size-px overflow-hidden"
        aria-hidden="true"
      >
        <label htmlFor="c-web">Leave this empty</label>
        <input
          id="c-web"
          name="hp_trap"
          type="text"
          tabIndex={-1}
          autoComplete="new-password"
        />
      </div>

      {/* Topic chips */}
      <fieldset className="flex flex-col gap-2.5">
        <legend className={`${labelClass} mb-2.5`}>{t.contact.topic}</legend>
        <div className="flex flex-wrap gap-2">
          {t.contact.topics.map((label: string, i: number) => (
            <button
              key={label}
              type="button"
              aria-pressed={topic === i}
              onClick={() => setTopic(topic === i ? null : i)}
              className="min-h-10 cursor-pointer rounded-full border border-line2 px-4 text-[13px] text-muted transition-colors hover:border-hl hover:text-fg aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-ink"
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Name */}
        <div className="flex flex-col gap-2.5">
          <label htmlFor="c-name" className={labelClass}>
            {t.contact.name}
            <span className="ms-1 text-accent">*</span>
          </label>

          <input
            id="c-name"
            name="name"
            type="text"
            required
            maxLength={100}
            autoComplete="name"
            placeholder={t.contact.namePh}
            className={fieldClass}
            disabled={state === 'sending'}
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2.5">
          <label htmlFor="c-mail" className={labelClass}>
            {t.contact.email}
            <span className="ms-1 text-accent">*</span>
          </label>

          <input
            id="c-mail"
            name="email"
            type="email"
            required
            maxLength={120}
            autoComplete="email"
            placeholder={t.contact.emailPh}
            dir="auto"
            className={fieldClass}
            disabled={state === 'sending'}
          />
        </div>
      </div>

      {/* Message */}
      <div className="flex flex-col gap-2.5">
        <label htmlFor="c-msg" className={labelClass}>
          {t.contact.message}
          <span className="ms-1 text-accent">*</span>
        </label>

        <textarea
          id="c-msg"
          name="message"
          required
          rows={6}
          maxLength={4000}
          placeholder={t.contact.messagePh}
          className={`${fieldClass} min-h-[160px] resize-y leading-relaxed`}
          onChange={(e) => setCount(e.target.value.length)}
          disabled={state === 'sending'}
        />

        <p className="text-end font-mono text-[11px] text-muted" dir="ltr">
          {t.contact.chars.replace('{n}', String(count))}
        </p>
      </div>

      {/* Error */}
      <div
        aria-live="polite"
        className="min-h-0"
      >
        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn"
          >
            <span aria-hidden="true">!</span>
            {error}
          </p>
        )}
      </div>

      {/* Submit */}
      <div className="flex flex-col gap-4 border-t border-line2 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-muted">
          {t.contact.info}
        </p>

        <button
          data-magnetic
          type="submit"
          disabled={state === 'sending'}
          className={`${btnPrimary} inline-flex min-h-12 w-full items-center justify-center gap-3 px-7 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto`}
        >
          {state === 'sending' ? (
            <>
              <svg
                className="size-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="opacity-25"
                />
                <path
                  d="M21 12a9 9 0 0 0-9-9"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              {t.contact.sending}
            </>
          ) : (
            <>
              {t.contact.send}
              <span aria-hidden="true">{t.c.arrow}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
