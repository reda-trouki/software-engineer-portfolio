'use client';

import gsap from 'gsap';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { COLLECTION_KEYS, COLLECTIONS, PROFILE_FIELDS, allFields, type CollectionKey, type Field } from '@/lib/collections';
import { formatDate } from '@/lib/format';
import type { Item, Message } from '@/lib/store';
import MarkdownEditor from './MarkdownEditor';
import { uploadImage } from './upload';

type Tab = CollectionKey | 'overview' | 'messages' | 'profile';
type Values = Record<string, string>;
interface Props { initial: { profile: Values; data: Record<CollectionKey, Item[]>; messages: Message[] } }

const fld = 'w-full min-h-12 rounded-xl border border-line2 bg-bg px-3.5 text-[15px] text-fg placeholder:text-soft';
const smallBtn = 'inline-flex min-h-11 cursor-pointer items-center rounded-full border border-line2 bg-transparent px-3.5 font-mono text-[13px] text-fg';
const primaryBtn = 'min-h-12 cursor-pointer rounded-full bg-accent px-7 text-[14px] font-medium text-ink transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60';
const panel = 'flex flex-col gap-5 rounded-3xl border border-line2 bg-surface p-5 sm:p-8';

const blank = (fields: Field[]): Values => Object.fromEntries(allFields(fields).map((f) => [f.key, f.kind === 'select' ? f.options![0] : '']));

type Lang = 'en' | 'fr' | 'ar';
const LANG_NAMES: Record<Lang, string> = { en: 'English', fr: 'Français', ar: 'العربية' };

/** One field. Translatable fields edit `<key>_fr` / `<key>_ar` when a non-English language is selected. */
function FieldInput({ f, id, values, setValue, lang }: { f: Field; id: string; values: Values; setValue: (key: string, v: string) => void; lang: Lang }) {
  const translated = !!f.i18n && lang !== 'en';
  const key = translated ? `${f.key}_${lang}` : f.key;
  const value = values[key] ?? '';
  const rtl = translated && lang === 'ar';
  const placeholder = translated ? (values[f.key] || f.placeholder || '').slice(0, 90) : f.placeholder;
  const common = { id, value, maxLength: f.max, placeholder, dir: rtl ? 'rtl' : 'ltr', lang: translated ? lang : 'en' } as const;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-mono text-xs text-muted">{f.label}{translated ? ` · ${LANG_NAMES[lang]}` : ''}{f.required && !translated ? ' *' : ''}</label>
      {f.kind === 'markdown' ? (
        <MarkdownEditor id={id} value={value} onChange={(v) => setValue(key, v)} placeholder={placeholder} maxLength={f.max} dir={rtl ? 'rtl' : 'ltr'} lang={translated ? lang : 'en'} />
      ) : f.kind === 'image' ? (
        <ImageField id={id} value={value} onChange={(v) => setValue(key, v)} placeholder={f.placeholder} />
      ) : f.kind === 'area' ? (
        <textarea {...common} rows={f.rows} className={`${fld} resize-y py-3 leading-normal`} onChange={(e) => setValue(key, e.target.value)} />
      ) : f.kind === 'select' ? (
        <select id={id} className={fld} value={value} onChange={(e) => setValue(key, e.target.value)}>
          {f.options!.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input {...common} className={fld} type={f.kind === 'url' ? 'url' : 'text'} onChange={(e) => setValue(key, e.target.value)} />
      )}
    </div>
  );
}

function ImageField({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true); setErr('');
    try { onChange(await uploadImage(file)); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="photo-ph h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-line2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value && <img src={value} alt="" className="size-full object-cover" />}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className={`${smallBtn} ${busy ? 'opacity-60' : ''}`}>
            {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pick} disabled={busy} />
          </label>
          {value && <button type="button" className={smallBtn} onClick={() => onChange('')}>Remove</button>}
        </div>
      </div>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={500} className={fld} />
      {err && <span className="font-mono text-xs text-warn">{err}</span>}
    </div>
  );
}

function LangTabs({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div role="tablist" aria-label="Content language" className="inline-flex self-start rounded-full border border-line2 p-0.5">
        {(['en', 'fr', 'ar'] as Lang[]).map((l) => (
          <button key={l} type="button" role="tab" aria-selected={lang === l} onClick={() => setLang(l)} lang={l}
            className="min-h-9 cursor-pointer rounded-full px-4 text-[13px] text-muted transition-colors aria-selected:bg-accent aria-selected:text-ink">{LANG_NAMES[l]}</button>
        ))}
      </div>
      {lang !== 'en' && <p className="font-mono text-[11px] leading-relaxed text-muted">Translating the text fields. Anything left empty falls back to English on the site.</p>}
    </div>
  );
}

export default function AdminPanel({ initial }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState(initial.data);
  const [messages, setMessages] = useState(initial.messages);
  const [profile, setProfile] = useState<Values>(initial.profile);
  const [forms, setForms] = useState<Record<string, Values>>(() => Object.fromEntries(COLLECTION_KEYS.map((k) => [k, blank(COLLECTIONS[k].fields)])));
  const [editing, setEditing] = useState<string | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [q, setQ] = useState('');
  const [pins, setPins] = useState({ current: '', next: '', again: '' });
  const [pinStatus, setPinStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!status) return;
    const id = setTimeout(() => setStatus(null), status.ok ? 3500 : 7000);
    return () => clearTimeout(id);
  }, [status]);

  // animate content in whenever the section changes
  useEffect(() => {
    const el = body.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el.children, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out' });
    }, el);
    return () => ctx.revert();
  }, [tab]);

  async function api<T>(method: string, url: string, payload?: unknown): Promise<T> {
    const res = await fetch(url, { method, headers: payload ? { 'Content-Type': 'application/json' } : undefined, body: payload ? JSON.stringify(payload) : undefined });
    if (res.status === 401 && url !== '/api/auth/pin') { router.refresh(); throw new Error('Session expired. Please sign in again.'); }
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || 'Request failed.');
    return j as T;
  }

  function choose(t: Tab) {
    setTab(t);
    setEditing(null);
    setStatus(null);
    setQ('');
    if (t !== 'messages' && t !== 'profile' && t !== 'overview') setForms((f) => ({ ...f, [t]: blank(COLLECTIONS[t].fields) }));
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setStatus(null);
    try { await fn(); } catch (e) { setStatus({ ok: false, text: (e as Error).message }); } finally { setBusy(false); }
  }

  const isCollection = tab !== 'messages' && tab !== 'profile' && tab !== 'overview';
  const def = isCollection ? COLLECTIONS[tab] : null;

  function submitCollection(e: FormEvent) {
    e.preventDefault();
    if (!def) return;
    const key = def.key;
    run(async () => {
      if (editing) {
        const item = await api<Item>('PUT', `/api/${key}/${editing}`, forms[key]);
        setData((d) => ({ ...d, [key]: d[key].map((x) => (x.id === item.id ? item : x)) }));
        setStatus({ ok: true, text: 'Updated.' });
      } else {
        const item = await api<Item>('POST', `/api/${key}`, forms[key]);
        setData((d) => ({ ...d, [key]: def.prepend ? [item, ...d[key]] : [...d[key], item] }));
        setStatus({ ok: true, text: 'Added.' });
      }
      setEditing(null);
      setForms((f) => ({ ...f, [key]: blank(def.fields) }));
    });
  }

  function remove(key: CollectionKey, id: string) {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    run(async () => {
      await api('DELETE', `/api/${key}/${id}`);
      setData((d) => ({ ...d, [key]: d[key].filter((x) => x.id !== id) }));
      if (editing === id) { setEditing(null); setForms((f) => ({ ...f, [key]: blank(COLLECTIONS[key].fields) })); }
    });
  }

  function saveProfile(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      const saved = await api<Values>('PUT', '/api/profile', profile);
      setProfile(saved);
      setStatus({ ok: true, text: 'Saved. The site is updated.' });
      router.refresh(); // pick up the new accent colour etc.
    });
  }

  function uploadPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    run(async () => {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Upload failed.');
      setProfile((p) => ({ ...p, photoUrl: j.url }));
      setStatus({ ok: true, text: 'Photo uploaded and live on the About section.' });
      router.refresh();
    });
  }

  async function changePin(e: FormEvent) {
    e.preventDefault();
    if (pins.next !== pins.again) { setPinStatus({ ok: false, text: 'The new PINs do not match.' }); return; }
    setBusy(true);
    try {
      await api('PATCH', '/api/auth/pin', { current: pins.current, next: pins.next });
      setPins({ current: '', next: '', again: '' });
      setPinStatus({ ok: true, text: 'PIN changed.' });
    } catch (err) {
      setPinStatus({ ok: false, text: (err as Error).message });
    } finally { setBusy(false); }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
  }

  const ICONS: Record<string, string> = {
    overview: 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 4v4h6V4z',
    posts: 'M5 4h14v16H5zM8 9h8M8 13h8M8 17h5',
    templates: 'M4 5h16v14H4zM4 10h16M9 10v9',
    projects: 'M3 7h18v12H3zM9 7V4h6v3',
    skills: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
    experience: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
    education: 'M2 9l10-5 10 5-10 5zM6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5',
    certifications: 'M12 14a5 5 0 100-10 5 5 0 000 10zM8.5 13.2L7 21l5-3 5 3-1.5-7.8',
    messages: 'M4 5h16v12H8l-4 3z',
    profile: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3.6-6 8-6s8 2 8 6',
  };
  const Icon = ({ k }: { k: string }) => (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[k]} /></svg>
  );

  const groups: { title: string; items: { id: Tab; label: string; count?: string }[] }[] = [
    { title: 'Workspace', items: [{ id: 'overview', label: 'Overview' }] },
    { title: 'Content', items: (['posts', 'templates', 'projects', 'skills'] as CollectionKey[]).map((k) => ({ id: k as Tab, label: COLLECTIONS[k].label, count: String(data[k].length) })) },
    { title: 'Résumé', items: (['experience', 'education', 'certifications'] as CollectionKey[]).map((k) => ({ id: k as Tab, label: COLLECTIONS[k].label, count: String(data[k].length) })) },
    { title: 'Inbox & settings', items: [{ id: 'messages', label: 'Messages', count: String(messages.length) }, { id: 'profile', label: 'Profile & security' }] },
  ];
  const flat = groups.flatMap((g) => g.items);
  const current = flat.find((t) => t.id === tab)!;
  const subtitle: Record<string, string> = {
    overview: 'A quick look at your site, and shortcuts to what you do most.',
    messages: 'Messages sent through the contact form.',
    profile: 'Your public details, photo and admin PIN.',
  };

  const published = data.posts.filter((p) => p.status === 'Published').length;
  const stats = [
    { label: 'Published posts', value: published, hint: `${data.posts.length - published} draft${data.posts.length - published === 1 ? '' : 's'}`, go: 'posts' as Tab },
    { label: 'Templates', value: data.templates.length, hint: 'ready to clone', go: 'templates' as Tab },
    { label: 'Projects', value: data.projects.length, hint: 'on the home page', go: 'projects' as Tab },
    { label: 'Messages', value: messages.length, hint: messages.length ? 'waiting for you' : 'inbox is empty', go: 'messages' as Tab },
  ];
  const quick: { label: string; go: Tab }[] = [
    { label: 'Write a post', go: 'posts' }, { label: 'Add a certification', go: 'certifications' }, { label: 'Add a template', go: 'templates' }, { label: 'Add a project', go: 'projects' }, { label: 'Edit my profile', go: 'profile' },
  ];

  const list = def ? data[def.key].filter((it) => !q.trim() || Object.values(it).some((v) => typeof v === 'string' && v.toLowerCase().includes(q.trim().toLowerCase()))) : [];

  const navBtn = 'group flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-start text-[14px] text-muted transition-colors hover:bg-line hover:text-fg aria-selected:bg-accent aria-selected:text-ink';

  return (
    <div className="min-h-screen" dir="ltr" lang="en">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <div className="flex min-h-10 items-center gap-3 font-mono text-[14px]">
            <span className="size-3 rounded-[3px] bg-accent" />
            <span>admin<span className="text-muted">@portfolio</span></span>
            <span className="hidden items-center gap-1.5 rounded-full border border-line2 px-2.5 py-1 text-[11px] text-muted sm:inline-flex"><span className="size-1.5 animate-pulse-soft rounded-full bg-accent" />signed in</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/" className={`${smallBtn} px-4 text-sm`}>View site ↗</Link>
            <button type="button" onClick={logout} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-accent px-4 font-mono text-sm font-medium text-ink">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
              Lock
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1320px] gap-8 px-4 pb-24 pt-6 sm:px-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:pt-10">
        {/* ---------- sidebar (tab strip on small screens) ---------- */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav role="tablist" aria-label="Sections" className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:gap-5 lg:overflow-visible lg:pb-0">
            {groups.map((g) => (
              <div key={g.title} className="flex shrink-0 gap-1.5 lg:flex-col lg:gap-1">
                <div className="hidden px-3 pb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-soft lg:block">{g.title}</div>
                {g.items.map((t) => (
                  <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => choose(t.id)} className={navBtn}>
                    <Icon k={t.id} />
                    <span className="flex-1 whitespace-nowrap">{t.label}</span>
                    {t.count !== undefined && <span className="rounded-full bg-black/20 px-2 py-0.5 font-mono text-[11px] group-aria-selected:bg-ink/15">{t.count}</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* ---------- content ---------- */}
        <main className="min-w-0">
          <div className="mb-7 flex flex-col gap-2">
            <div className="font-mono text-xs text-accent">~/admin/{tab}</div>
            <h1 className="font-hd text-[clamp(24px,2.6vw,32px)] font-semibold leading-tight tracking-[-0.03em]">{current.label}</h1>
            <p className="max-w-[620px] text-[15px] leading-relaxed text-muted">{def ? `Add, edit or remove ${def.label.toLowerCase()}. Changes go live on the public site immediately.` : subtitle[tab]}</p>
          </div>

          <div ref={body} className="grid grid-cols-[repeat(auto-fit,minmax(min(440px,100%),1fr))] items-start gap-6">
            {/* ---------- overview ---------- */}
            {tab === 'overview' && (
              <>
                <div className="col-span-full grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
                  {stats.map((st) => (
                    <button key={st.label} type="button" onClick={() => choose(st.go)} className="flex cursor-pointer flex-col gap-1 rounded-3xl border border-line2 bg-surface p-5 text-start transition duration-300 hover:-translate-y-1 hover:border-hl">
                      <span className="font-mono text-xs text-muted">{st.label}</span>
                      <b className="font-hd text-[40px] font-semibold leading-none tracking-[-0.03em]">{st.value}</b>
                      <span className="font-mono text-[11px] text-accent">{st.hint}</span>
                    </button>
                  ))}
                </div>
                <div className={`${panel} col-span-full`}>
                  <h2 className="font-hd text-lg font-semibold">Quick actions</h2>
                  <div className="flex flex-wrap gap-3">
                    {quick.map((a) => <button key={a.label} type="button" onClick={() => choose(a.go)} className={`${smallBtn} min-h-12 px-5 text-sm`}>{a.label} →</button>)}
                  </div>
                </div>
              </>
            )}

            {/* ---------- collection form + list ---------- */}
            {def && (
              <>
                <form onSubmit={submitCollection} className={panel}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-hd text-lg font-semibold">{editing ? `Edit ${def.noun}` : `New ${def.noun}`}</h2>
                    {editing && <span className="rounded-full bg-accent/15 px-2.5 py-1 font-mono text-[11px] text-accent">editing</span>}
                  </div>
                  {def.fields.some((f) => f.i18n) && <LangTabs lang={lang} setLang={setLang} />}
                  {def.fields.map((f) => (
                    <FieldInput key={f.key} f={f} lang={lang} id={`f-${def.key}-${f.key}`} values={forms[def.key]} setValue={(k, v) => setForms((st) => ({ ...st, [def.key]: { ...st[def.key], [k]: v } }))} />
                  ))}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button type="submit" disabled={busy} className={primaryBtn}>{editing ? `Update ${def.noun} →` : `Add ${def.noun} →`}</button>
                    {editing && <button type="button" className={`${smallBtn} min-h-12 px-5 text-sm`} onClick={() => { setEditing(null); setForms((st) => ({ ...st, [def.key]: blank(def.fields) })); }}>Cancel edit</button>}
                  </div>
                </form>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                    <span className="font-mono text-xs text-muted">{list.length} of {data[def.key].length} {def.label.toLowerCase()}</span>
                    {data[def.key].length > 4 && <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…" aria-label="Filter list" className="min-h-10 w-40 rounded-full border border-line2 bg-surface px-4 text-[13px] text-fg placeholder:text-soft" />}
                  </div>
                  {list.map((it) => {
                    const chip = def.chip ? it[def.chip] : '';
                    const hot = chip === 'Published' || chip.toLowerCase() === 'free';
                    const meta = [...def.meta.map((k) => it[k]), def.key === 'posts' ? formatDate(it.date) : ''].filter(Boolean).join(' · ');
                    const langs = ['fr', 'ar'].filter((l) => def.fields.some((f) => f.i18n && it[`${f.key}_${l}`]));
                    return (
                      <div key={it.id} className={`flex flex-wrap items-center justify-between gap-x-5 gap-y-3 rounded-2xl border bg-surface px-5 py-4 transition-colors ${editing === it.id ? 'border-accent' : 'border-line2 hover:border-hl'}`}>
                        <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-1.5">
                          <b className="break-words font-hd text-[17px] font-semibold leading-tight">{it[def.main]}</b>
                          <span className="flex flex-wrap items-center gap-2 break-words font-mono text-xs text-muted">
                            {meta}
                            {langs.map((l) => <span key={l} className="rounded border border-line2 px-1.5 py-px text-[10px] uppercase">{l}</span>)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {chip && <span className={`rounded-full border px-2.5 py-1 font-mono text-xs ${hot ? 'border-accent bg-accent text-ink' : 'border-hl'}`}>{chip}</span>}
                          {def.key === 'posts' && <Link className={smallBtn} href={`/blog/${it.slug}`}>View</Link>}
                          <button type="button" className={smallBtn} onClick={() => { setEditing(it.id); setStatus(null); setForms((st) => ({ ...st, [def.key]: Object.fromEntries(allFields(def.fields).map((f) => [f.key, it[f.key] ?? ''])) })); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</button>
                          <button type="button" className={`${smallBtn} !text-warn`} onClick={() => remove(def.key, it.id)}>Delete</button>
                        </div>
                      </div>
                    );
                  })}
                  {list.length === 0 && <div className="rounded-2xl border border-dashed border-line2 p-10 text-center text-[15px] text-muted">{data[def.key].length ? 'Nothing matches your filter.' : 'Nothing here yet. Add your first one with the form.'}</div>}
                </div>
              </>
            )}

            {/* ---------- messages ---------- */}
            {tab === 'messages' && (
              <div className="col-span-full flex flex-col gap-3">
                {messages.map((m) => (
                  <div key={m.id} className="flex flex-col gap-3 rounded-2xl border border-line2 bg-surface px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-full bg-accent font-mono text-sm font-semibold text-ink">{m.name.slice(0, 1).toUpperCase()}</span>
                        <div className="flex flex-col gap-0.5">
                          <b className="font-hd text-[16px] font-semibold">{m.name}</b>
                          <a className="font-mono text-xs text-accent" href={`mailto:${m.email}`}>{m.email}</a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-muted">{formatDate(m.date)}{m.emailed ? ' · emailed' : ''}</span>
                        <button type="button" className={`${smallBtn} !text-warn`} onClick={() => { if (confirm('Delete this message?')) run(async () => { await api('DELETE', `/api/contact/${m.id}`); setMessages((x) => x.filter((y) => y.id !== m.id)); }); }}>Delete</button>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-fg/85">{m.message}</p>
                  </div>
                ))}
                {messages.length === 0 && <div className="rounded-2xl border border-dashed border-line2 p-10 text-center text-[15px] text-muted">No messages yet.</div>}
              </div>
            )}

            {/* ---------- profile & security ---------- */}
            {tab === 'profile' && (
              <>
                <form onSubmit={saveProfile} className={panel}>
                  <h2 className="font-hd text-lg font-semibold">Profile</h2>
                  <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-dashed border-line2 p-4">
                    <div className="photo-ph size-24 shrink-0 overflow-hidden rounded-2xl border border-line2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {profile.photoUrl && <img src={profile.photoUrl} alt="Current profile" className="size-full object-cover" />}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <span className="font-mono text-xs text-muted">Profile photo (JPG, PNG or WebP, max 5 MB)</span>
                      <label className={`${smallBtn} self-start`}>
                        Upload photo
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={uploadPhoto} />
                      </label>
                    </div>
                  </div>
                  <LangTabs lang={lang} setLang={setLang} />
                  {PROFILE_FIELDS.filter((f) => f.key !== 'photoUrl').map((f) => (
                    <FieldInput key={f.key} f={f} lang={lang} id={`p-${f.key}`} values={profile} setValue={(k, v) => setProfile((pr) => ({ ...pr, [k]: v }))} />
                  ))}
                  <button type="submit" disabled={busy} className={`${primaryBtn} self-start`}>Save changes</button>
                </form>

                <form onSubmit={changePin} className={panel}>
                  <h2 className="font-hd text-lg font-semibold">Admin PIN</h2>
                  <p className="text-[15px] leading-relaxed text-muted">The PIN is stored hashed on the server. Choose 4 to 8 digits.</p>
                  {(['current', 'next', 'again'] as const).map((k) => (
                    <div key={k} className="flex flex-col gap-2">
                      <label htmlFor={`pin-${k}`} className="font-mono text-xs text-muted">{k === 'current' ? 'Current PIN' : k === 'next' ? 'New PIN' : 'Repeat new PIN'}</label>
                      <input id={`pin-${k}`} className={`${fld} text-center font-mono text-lg tracking-[0.5em]`} type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={pins[k]} onChange={(e) => setPins((pr) => ({ ...pr, [k]: e.target.value.replace(/\D/g, '') }))} />
                    </div>
                  ))}
                  <div role="status" className={`min-h-[18px] font-mono text-[13px] ${pinStatus?.ok ? 'text-accent' : 'text-warn'}`}>{pinStatus?.text}</div>
                  <button type="submit" disabled={busy} className={`${primaryBtn} self-start`}>Change PIN</button>
                </form>
              </>
            )}
          </div>
        </main>
      </div>

      {/* toast */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-5 z-50 flex justify-center sm:justify-end sm:pe-4">
        {status && (
          <div role="status" className={`pointer-events-auto flex max-w-[420px] items-center gap-3 rounded-2xl border px-4 py-3 font-mono text-[13px] shadow-2xl ${status.ok ? 'border-accent/40 bg-surface text-fg' : 'border-warn/50 bg-surface text-warn'}`}>
            <span className={`size-2 shrink-0 rounded-full ${status.ok ? 'bg-accent' : 'bg-warn'}`} />
            {status.text}
            <button type="button" aria-label="Dismiss" onClick={() => setStatus(null)} className="ms-1 cursor-pointer text-muted hover:text-fg">×</button>
          </div>
        )}
      </div>
    </div>
  );
}
