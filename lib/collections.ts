// Single source of truth for the editable content: used by the API (validation)
// and by the admin UI (it renders its forms from these definitions).

export type FieldKind = 'text' | 'area' | 'select' | 'url' | 'image' | 'markdown';

export interface Field {
  key: string;
  label: string;
  kind: FieldKind;
  max: number;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  rows?: number;
  i18n?: boolean; // translatable: also stored as `<key>_fr` and `<key>_ar`
}

export const TRANSLATIONS = ['fr', 'ar'] as const;

/** Every field including the generated `<key>_fr` / `<key>_ar` variants of translatable ones. */
export function allFields(fields: Field[]): Field[] {
  return fields.flatMap((f) => (f.i18n ? [f, ...TRANSLATIONS.map((l) => ({ ...f, key: `${f.key}_${l}`, label: `${f.label} (${l.toUpperCase()})`, required: false }))] : [f]));
}

export const COLLECTION_KEYS = ['posts', 'templates', 'projects', 'skills', 'experience', 'education', 'certifications'] as const;
export type CollectionKey = (typeof COLLECTION_KEYS)[number];

export interface CollectionDef {
  key: CollectionKey;
  label: string;
  noun: string;
  main: string; // field shown as the item title
  meta: string[]; // fields joined under the title
  chip?: string; // field shown as a badge
  prepend?: boolean; // new items go first (newest first)
  fields: Field[];
}

const text = (key: string, label: string, max: number, extra: Partial<Field> = {}): Field => ({ key, label, kind: 'text', max, ...extra });
const area = (key: string, label: string, max: number, rows: number, extra: Partial<Field> = {}): Field => ({ key, label, kind: 'area', max, rows, ...extra });
const url = (key: string, label: string, extra: Partial<Field> = {}): Field => ({ key, label, kind: 'url', max: 500, placeholder: 'https://', ...extra });
const image = (key: string, label: string, extra: Partial<Field> = {}): Field => ({ key, label, kind: 'image', max: 500, placeholder: 'Upload, or paste an https:// or /media/… link', ...extra });
const markdown = (key: string, label: string, max: number, rows: number, extra: Partial<Field> = {}): Field => ({ key, label, kind: 'markdown', max, rows, ...extra });
const select = (key: string, label: string, options: string[], extra: Partial<Field> = {}): Field => ({ key, label, kind: 'select', max: 80, options, ...extra });

export const COLLECTIONS: Record<CollectionKey, CollectionDef> = {
  posts: {
    key: 'posts', label: 'Blog posts', noun: 'post', main: 'title', meta: ['topic'], chip: 'status', prepend: true,
    fields: [
      text('title', 'Title', 140, { required: true, placeholder: 'A specific, honest title', i18n: true }),
      text('topic', 'Topic', 40, { required: true, placeholder: 'e.g. Backend', i18n: true }),
      area('excerpt', 'Excerpt', 300, 2, { placeholder: 'One or two sentences shown on the blog list', i18n: true }),
      image('cover', 'Cover image'),
      markdown('body', 'Content (Markdown)', 30000, 16, { required: true, placeholder: '# Start writing…', i18n: true }),
      select('status', 'Status', ['Published', 'Draft'], { required: true }),
    ],
  },
  templates: {
    key: 'templates', label: 'Templates', noun: 'template', main: 'name', meta: ['category', 'stack'], chip: 'price',
    fields: [
      text('name', 'Name', 120, { required: true, placeholder: 'e.g. API boilerplate', i18n: true }),
      text('category', 'Category', 40, { required: true, placeholder: 'Web, Backend, Tooling…', i18n: true }),
      text('price', 'Price', 40, { placeholder: 'Free or $29', i18n: true }),
      text('stack', 'Stack (comma separated)', 200, { placeholder: 'Next.js, TypeScript, Postgres' }),
      area('description', 'Description', 400, 3, { placeholder: 'What does it save people from doing?', i18n: true }),
      url('link', 'Download or repo link'),
    ],
  },
  projects: {
    key: 'projects', label: 'Projects', noun: 'project', main: 'name', meta: ['type', 'stack'],
    fields: [
      text('name', 'Project name', 120, { required: true }),
      text('type', 'Type', 40, { required: true, placeholder: 'Web app, Backend / API, Open source…', i18n: true }),
      area('description', 'Description', 400, 3, { placeholder: 'The problem it solves, your role, the result', i18n: true }),
      text('stack', 'Stack (comma separated)', 200, { placeholder: 'React, Node.js' }),
      image('image', 'Project image (optional)'),
      url('liveUrl', 'Live demo link'),
      url('codeUrl', 'Source code link'),
    ],
  },
  skills: {
    key: 'skills', label: 'Skills', noun: 'skill', main: 'name', meta: [], chip: 'row',
    fields: [
      text('name', 'Skill', 60, { required: true, placeholder: 'e.g. TypeScript' }),
      select('row', 'Loop row', ['Technologies', 'Practices & infra'], { required: true }),
    ],
  },
  experience: {
    key: 'experience', label: 'Experience', noun: 'role', main: 'title', meta: ['company', 'start', 'end'],
    fields: [
      text('title', 'Job title', 100, { required: true, i18n: true }),
      text('company', 'Company', 100, { required: true }),
      text('start', 'Start', 40, { placeholder: 'e.g. Jan 2023', i18n: true }),
      text('end', 'End', 40, { placeholder: 'e.g. Present', i18n: true }),
      area('summary', 'Highlights (one per line)', 1500, 5, { i18n: true }),
      text('stack', 'Stack (comma separated)', 200),
    ],
  },
  education: {
    key: 'education', label: 'Education', noun: 'entry', main: 'degree', meta: ['school', 'years'],
    fields: [
      text('degree', 'Degree or diploma', 140, { required: true, i18n: true }),
      text('school', 'School', 140, { required: true, i18n: true }),
      text('years', 'Years', 40, { placeholder: 'e.g. 2019 — 2023', i18n: true }),
      area('note', 'Note', 300, 2, { placeholder: 'Focus area, thesis or distinction', i18n: true }),
    ],
  },
  certifications: {
    key: 'certifications', label: 'Certifications', noun: 'certification', main: 'title', meta: ['issuer', 'date'],
    fields: [
      text('title', 'Certification', 140, { required: true, placeholder: 'e.g. Cloud Developer Associate', i18n: true }),
      text('issuer', 'Issuing organisation', 120, { required: true, placeholder: 'e.g. Amazon Web Services', i18n: true }),
      text('date', 'Date', 40, { placeholder: 'e.g. Jun 2024', i18n: true }),
      text('credentialId', 'Credential ID', 80),
      url('link', 'Verification link'),
      image('image', 'Badge image (optional)'),
    ],
  },
};

export const ACCENTS = ['#C6F432', '#7DF9C9', '#FFB86B', '#B69CFF'];

export const PROFILE_FIELDS: Field[] = [
  text('name', 'Full name', 80, { required: true, i18n: true }),
  text('role', 'Role', 80, { required: true, i18n: true }),
  text('headline', 'Hero headline', 200, { required: true, i18n: true }),
  text('highlight', 'Highlighted words in headline', 80, { placeholder: 'A phrase from the headline to colour', i18n: true }),
  area('intro', 'Hero intro', 400, 3, { i18n: true }),
  area('bio', 'About bio (blank line = new paragraph)', 2000, 5, { i18n: true }),
  text('city', 'City', 80, { i18n: true }),
  text('languages', 'Languages spoken', 120, { i18n: true }),
  text('currently', 'Currently', 120, { placeholder: 'Role @ Company', i18n: true }),
  text('openTo', 'Open to', 120, { placeholder: 'Freelance, full-time…', i18n: true }),
  text('now', 'What you are building now', 200, { i18n: true }),
  text('loopWords', 'Loop words (comma separated)', 120, { placeholder: 'BUILD, SHIP, ITERATE, REPEAT', i18n: true }),
  text('email', 'Email', 120),
  url('github', 'GitHub URL'),
  url('linkedin', 'LinkedIn URL'),
  url('twitter', 'X / other URL'),
  url('photoUrl', 'Photo URL'),
  select('availability', 'Availability', ['Available for new projects', 'Not available right now'], { required: true }),
  select('accent', 'Accent colour', ACCENTS, { required: true }),
];

export function isCollectionKey(k: string): k is CollectionKey {
  return (COLLECTION_KEYS as readonly string[]).includes(k);
}

export type Cleaned = Record<string, string>;

/** Validates and trims input against a field list. Never trusts the client. */
export function validate(fields: Field[], input: unknown): { data: Cleaned } | { error: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Invalid request body.' };
  const src = input as Record<string, unknown>;
  const data: Cleaned = {};
  for (const f of allFields(fields)) {
    const raw = src[f.key];
    const value = typeof raw === 'string' ? raw.trim() : raw == null ? '' : null;
    if (value === null) return { error: `${f.label} must be text.` };
    if (f.required && !value) return { error: `${f.label} is required.` };
    if (value.length > f.max) return { error: `${f.label} is too long (max ${f.max} characters).` };
    // links must be http(s) or a same-site path (e.g. an uploaded /media/… photo); never javascript:
    if ((f.kind === 'url' || f.kind === 'image') && value && !/^(https?:\/\/[^\s]+|\/(?!\/)[\w./-]*)$/i.test(value)) return { error: `${f.label} must start with http:// or https://.` };
    if (f.kind === 'select' && value && !f.options!.includes(value)) return { error: `${f.label} has an invalid value.` };
    if (f.key === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { error: 'Email looks invalid.' };
    data[f.key] = value;
  }
  return { data };
}
