'use client';

import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import Markdown from '@/components/Markdown';
import { readingMinutes } from '@/lib/format';
import { uploadImage } from './upload';

const TEMPLATES: Record<string, string> = {
  'Blog post outline': `## The problem

Describe the situation in two or three sentences. Who has this problem, and why does it matter?

## What I tried

- First approach, and why it fell short
- Second approach

## The solution

Explain the approach that worked.

\`\`\`ts
// a short, runnable example
\`\`\`

## Takeaways

> One sentence the reader should remember.
`,
  'Project README': `# Project name

One sentence on what this project does and who it is for.

![Screenshot](/covers/api.svg "Add a screenshot here")

## Features

- Feature one
- Feature two
- Feature three

## Getting started

\`\`\`bash
git clone https://github.com/you/project.git
cd project
npm install
npm run dev
\`\`\`

## Usage

\`\`\`ts
import { thing } from 'project';

thing.run();
\`\`\`

## Configuration

| Option | Default | Description |
| ------ | ------- | ----------- |
| \`port\` | \`3000\` | Port to listen on |
| \`debug\` | \`false\` | Verbose logging |

## License

MIT
`,
  'Tutorial': `## What you will build

A short description of the end result, and what the reader will learn.

## Prerequisites

- Node.js 20+
- Basic knowledge of TypeScript

## Step 1: Set up

Explain the first step.

## Step 2: Build it

Explain the second step.

## Wrap up

What to try next.
`,
};

type Mode = 'write' | 'preview' | 'split';

interface Props {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  dir?: 'ltr' | 'rtl';
  lang?: string;
}

const tb = 'inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg px-2 font-mono text-[12px] text-muted transition-colors hover:bg-line hover:text-fg disabled:cursor-wait disabled:opacity-50';

/** A README/Markdown writer: toolbar, live preview, image upload (button, paste or drop), starter templates, full-screen mode. */
export default function MarkdownEditor({ id, value, onChange, placeholder, maxLength, dir = 'ltr', lang = 'en' }: Props) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>('write');
  const [full, setFull] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  // full-screen: lock page scroll, Esc to leave, split view by default
  useEffect(() => {
    if (!full) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') setFull(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [full]);

  function toggleFull() {
    setFull((f) => { setMode(f ? 'write' : 'split'); return !f; });
  }

  /** Replace [start,end) of the value and reselect [selStart,selEnd). */
  function edit(start: number, end: number, insert: string, selStart: number, selEnd: number) {
    const next = value.slice(0, start) + insert + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => { ta.current?.focus(); ta.current?.setSelectionRange(selStart, selEnd); });
  }

  function wrap(before: string, after: string, fallback: string) {
    const el = ta.current; if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = value.slice(s, e) || fallback;
    edit(s, e, before + sel + after, s + before.length, s + before.length + sel.length);
  }

  function linePrefix(prefix: string | ((i: number) => string)) {
    const el = ta.current; if (!el) return;
    const s = value.lastIndexOf('\n', el.selectionStart - 1) + 1;
    let e = value.indexOf('\n', el.selectionEnd); if (e === -1) e = value.length;
    const lines = value.slice(s, e).split('\n');
    const pre = (i: number) => (typeof prefix === 'string' ? prefix : prefix(i));
    const all = lines.every((l, i) => l.startsWith(pre(i)));
    const out = lines.map((l, i) => (all ? l.slice(pre(i).length) : pre(i) + l.replace(/^(#{1,6}\s|>\s|[-*]\s|\d+\.\s)/, ''))).join('\n');
    edit(s, e, out, s, s + out.length);
  }

  function block(text: string, selectInner?: [number, number]) {
    const el = ta.current; if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const lead = s > 0 && value[s - 1] !== '\n' ? '\n\n' : s > 0 && value[s - 2] !== '\n' ? '\n' : '';
    const ins = lead + text + '\n';
    const base = s + lead.length;
    edit(s, e, ins, base + (selectInner?.[0] ?? text.length), base + (selectInner?.[1] ?? text.length));
  }

  function codeBlock() {
    const el = ta.current; if (!el) return;
    const sel = value.slice(el.selectionStart, el.selectionEnd);
    block('```ts\n' + (sel || 'code') + '\n```', sel ? undefined : [6, 10]);
  }

  function link() {
    const el = ta.current; if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = value.slice(s, e) || 'link text';
    const text = `[${sel}](https://)`;
    edit(s, e, text, s + sel.length + 3, s + text.length - 1);
  }

  function insertAtCursor(text: string) {
    const el = ta.current;
    const s = el?.selectionStart ?? value.length, e = el?.selectionEnd ?? value.length;
    const lead = s > 0 && value[s - 1] !== '\n' ? '\n\n' : '';
    edit(s, e, lead + text + '\n\n', s + lead.length + text.length + 2, s + lead.length + text.length + 2);
  }

  async function upload(files: FileList | File[] | null) {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;
    setBusy(true); setNote('');
    try {
      for (const f of list) {
        const url = await uploadImage(f);
        const alt = f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
        insertAtCursor(`![${alt}](${url} "${alt}")`);
      }
    } catch (e) { setNote((e as Error).message); } finally { setBusy(false); }
  }

  function applyTemplate(name: string) {
    if (!name) return;
    if (value.trim() && !confirm('Add this outline at the end of your text?')) return;
    onChange((value.trim() ? value.replace(/\s+$/, '') + '\n\n' : '') + TEMPLATES[name]);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === 'b') { e.preventDefault(); wrap('**', '**', 'bold text'); }
    else if (k === 'i') { e.preventDefault(); wrap('_', '_', 'italic text'); }
    else if (k === 'k') { e.preventDefault(); link(); }
  }

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith('image/'));
    if (files.length) { e.preventDefault(); void upload(files); }
  };
  const onDrop = (e: DragEvent<HTMLTextAreaElement>) => {
    if (e.dataTransfer.files.length) { e.preventDefault(); void upload(e.dataTransfer.files); }
  };

  const showWrite = mode !== 'preview';
  const showPreview = mode !== 'write';

  // full screen renders in a portal: an animated ancestor (transform) would otherwise trap position:fixed
  const ui = (
    <div className={full ? 'fixed inset-0 z-[60] flex flex-col gap-3 bg-bg p-3 sm:p-5' : 'flex flex-col gap-2'}>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line2 bg-surface p-1.5">
        <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5">
          <button type="button" className={tb} title="Heading 2" onClick={() => linePrefix('## ')}>H2</button>
          <button type="button" className={tb} title="Heading 3" onClick={() => linePrefix('### ')}>H3</button>
          <button type="button" className={`${tb} !font-sans font-bold`} title="Bold (Ctrl+B)" onClick={() => wrap('**', '**', 'bold text')}>B</button>
          <button type="button" className={`${tb} !font-sans italic`} title="Italic (Ctrl+I)" onClick={() => wrap('_', '_', 'italic text')}>I</button>
          <button type="button" className={tb} title="Inline code" onClick={() => wrap('`', '`', 'code')}>{'</>'}</button>
          <button type="button" className={tb} title="Code block" onClick={codeBlock}>{'{ }'}</button>
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-line2" />
          <button type="button" className={tb} title="Link (Ctrl+K)" onClick={link}>Link</button>
          <button type="button" className={tb} title="Upload and insert an image" disabled={busy} onClick={() => fileInput.current?.click()}>{busy ? 'Uploading…' : 'Image'}</button>
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-line2" />
          <button type="button" className={tb} title="Quote" onClick={() => linePrefix('> ')}>Quote</button>
          <button type="button" className={tb} title="Bulleted list" onClick={() => linePrefix('- ')}>• List</button>
          <button type="button" className={tb} title="Numbered list" onClick={() => linePrefix((i) => `${i + 1}. `)}>1. List</button>
          <button type="button" className={tb} title="Table" onClick={() => block('| Column | Column |\n| ------ | ------ |\n| Cell | Cell |')}>Table</button>
          <button type="button" className={tb} title="Divider" onClick={() => block('---')}>Line</button>
        </div>
        <div className="flex items-center gap-1.5">
          <select aria-label="Start from an outline" value="" onChange={(e) => applyTemplate(e.target.value)} className="h-9 max-w-[150px] cursor-pointer rounded-lg border border-line2 bg-bg px-2 font-mono text-[12px] text-muted">
            <option value="">Outline…</option>
            {Object.keys(TEMPLATES).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <div role="tablist" aria-label="Editor view" className="inline-flex rounded-lg border border-line2 p-0.5">
            {(['write', ...(full ? ['split'] : []), 'preview'] as Mode[]).map((m) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className="h-8 cursor-pointer rounded-md px-3 font-mono text-[12px] capitalize text-muted aria-selected:bg-accent aria-selected:text-ink">{m}</button>
            ))}
          </div>
          <button type="button" className={`${tb} border border-line2`} title={full ? 'Close full screen (Esc)' : 'Full-screen writer'} aria-pressed={full} onClick={toggleFull}>{full ? 'Close' : 'Expand'}</button>
        </div>
      </div>

      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" tabIndex={-1} onChange={(e) => { void upload(e.target.files); e.target.value = ''; }} />

      <div className={`grid min-h-0 gap-3 ${full ? 'flex-1' : ''} ${mode === 'split' ? 'md:grid-cols-2' : ''}`}>
        {showWrite && (
          <textarea
            ref={ta} id={id} value={value} dir={dir} lang={lang} maxLength={maxLength} placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} onPaste={onPaste} onDrop={onDrop} spellCheck
            className={`w-full resize-y rounded-2xl border border-line2 bg-bg p-4 font-mono text-[14px] leading-[1.75] text-fg placeholder:text-soft ${full ? 'h-full min-h-0 resize-none' : 'min-h-[340px]'}`}
          />
        )}
        {showPreview && (
          <div dir={dir} lang={lang} className={`overflow-auto rounded-2xl border border-line2 bg-bg p-5 sm:p-7 ${full ? 'min-h-0' : 'max-h-[600px] min-h-[340px]'}`}>
            {value.trim() ? <Markdown source={value} /> : <p className="font-mono text-sm text-muted">Nothing to preview yet. Start writing, or pick an outline.</p>}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 font-mono text-[11px] text-muted">
        <span>{words} words · ~{readingMinutes(value)} min read · {value.length.toLocaleString()}{maxLength ? ` / ${maxLength.toLocaleString()}` : ''} characters</span>
        <span className={note ? 'text-warn' : ''}>{note || 'Markdown supported. Paste or drop images to upload them.'}</span>
      </div>
    </div>
  );
  return full ? createPortal(ui, document.body) : ui;
}
