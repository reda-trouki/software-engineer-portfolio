// Heading ids and the table of contents are derived from the Markdown text with the same
// rules on the server (TOC) and in the renderer (ids), so they always match.

export interface TocItem { id: string; text: string; level: 2 | 3 }

/** Plain text of a heading after removing inline Markdown. */
export function plain(md: string): string {
  return md
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function slugify(text: string): string {
  const s = text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '') // strip Latin accents, keep Arabic letters
    .replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');
  return s || 'section';
}

/** Returns a function that turns heading text into a unique id (second "Setup" becomes "setup-1"). */
export function idGenerator() {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = slugify(text);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n ? `${base}-${n}` : base;
  };
}

export function extractToc(md: string): TocItem[] {
  const next = idGenerator();
  const out: TocItem[] = [];
  let fenced = false;
  for (const line of md.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; continue; }
    if (fenced) continue;
    const m = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const text = plain(m[2]);
    out.push({ id: next(text), text, level: m[1].length as 2 | 3 });
  }
  return out;
}
