# Portfolio — Next.js + Tailwind + GSAP

A software-engineer portfolio with a real backend (Next.js route handlers) and a PIN-protected admin panel.

**Pages:** Home (hero, about + competences loop, projects, academic path, experience, contact) · Blog · Blog post · Templates · Admin

## Run it

```bash
npm install
cp .env.example .env.local      # then edit ADMIN_PIN and SESSION_SECRET
npm run dev                     # http://localhost:3000
```

Open `/admin`, enter your PIN, and manage everything: blog posts, templates, projects, skills, experience, education, contact messages, your profile (name, headline, bio, photo, accent colour) and the PIN itself.

Production: `npm run build && npm start`.

## Your photo

Either upload it in **Admin → Profile & security → Upload photo** (JPG/PNG/WebP, max 5 MB), or drop a file at `public/me.jpg`.

## How it works

| Piece | Where |
|---|---|
| Data (JSON file, atomic writes) | `lib/store.ts` → `data/db.json` (created from `data/seed.json` on first run) |
| Editable fields + validation (shared by API and admin forms) | `lib/collections.ts` |
| PIN auth: scrypt-hashed PIN, signed httpOnly cookie, rate limit | `lib/auth.ts`, `app/api/auth/*` |
| REST API | `app/api/[collection]`, `app/api/profile`, `app/api/contact`, `app/api/upload` |
| Public pages (server components read the data directly) | `app/page.tsx`, `app/blog`, `app/templates` |
| Admin | `app/admin/page.tsx`, `components/admin/*` |
| Animations (GSAP + ScrollTrigger) | `components/Animations.tsx`, `Marquee.tsx`, `useStaggerIn.ts` |
| Styling | Tailwind v4, tokens in `app/globals.css` |

### API

- `GET /api/{posts|templates|projects|skills|experience|education}` — public (drafts hidden unless signed in)
- `POST /api/{collection}`, `PUT|DELETE /api/{collection}/{id}` — admin only
- `GET|PUT /api/profile` — read public, write admin
- `POST /api/contact` — public (rate-limited, honeypot) · `GET`/`DELETE` admin only
- `POST /api/auth/login` · `POST /api/auth/logout` · `PATCH /api/auth/pin`
- `POST /api/upload` — admin only (checks real image bytes)

### Security notes

- The PIN is stored only as a salted scrypt hash; login is limited to 5 tries / 15 min per IP.
- Session cookie is `HttpOnly`, `SameSite=Strict`, `Secure` over HTTPS, and expires after 8 hours.
- Every write is validated on the server (lengths, allowed values, `http(s)` links only) and checked for same-origin.
- `/admin` never sends data to the browser unless the session cookie is valid.
- A 4–8 digit PIN is only as strong as the rate limiter; keep it private and change the default.

## Deploying

The JSON store needs a **persistent disk** (a VPS, Railway/Fly/Render with a volume). Point `DATA_DIR` at that volume and set `ADMIN_PIN` and `SESSION_SECRET`. On serverless hosts with an ephemeral filesystem (e.g. Vercel) edits would be lost: replace `lib/store.ts` with a database (Postgres/SQLite/Supabase); it is the only file that touches storage. The rate limiter is in-memory, so use a shared store (e.g. Redis) if you run several instances.

## Animations

Server-rendered markup opts in with data attributes, so pages stay simple: `data-reveal`, `data-stagger`, `data-split`, `data-photo`, `data-line`, `data-magnetic`, `data-progress` (see the comment at the top of `components/Animations.tsx`). Everything respects `prefers-reduced-motion`.


## Design notes

- Fonts: Geist (sans + mono) and Instrument Serif (italic accents), bundled via `@fontsource`, so they work offline.
- Education and Experience use `components/StackedCards.tsx`: sticky GSAP-driven cards that overlap, shrink and dim like the iPhone product pages.
- The hero uses `data-spotlight`, a cursor-following glow. All motion respects `prefers-reduced-motion`.
- Your photo: upload it in Admin > Profile & security, or drop `public/me.jpg`.

## Languages (English, Français, العربية)

- The site is available in English, French and Arabic (right-to-left). The visitor's choice is stored in a `lang` cookie; the first visit follows the browser language.
- Interface text lives in `lib/i18n.ts` (one object per language). Add or edit wording there.
- Your content (blog posts, templates, projects, experience, education and your profile) is translated from the admin: open a form and use the **English | Français | العربية** tabs. Anything left empty falls back to English. Translations are stored as `<field>_fr` / `<field>_ar`.
- Arabic uses Noto Sans Arabic, mirrors the layout, and keeps code, numbers and the marquees left-to-right. The admin panel itself stays in English.

## Academic path ("elevator")

`components/ElevatorTimeline.tsx`: a cabin rides down the rail as you scroll; at each floor the doors slide open and the lines rise into place (and close again when you scroll back up). Experience keeps the pinned, overlapping card stack.

## Blog reading page

- Each post has an optional cover image, an automatic **table of contents** (from the `##` / `###` headings, with scroll-spy; collapsible on mobile), captioned figures for images, highlighted code blocks with a copy button, a reading-progress bar, and an author card.
- The same renderer (`components/Markdown.tsx`) powers the public page and the admin preview.

## Admin: README / Markdown writer

- Posts are written in a Markdown editor with a toolbar (headings, bold, italic, code, links, quotes, lists, tables), **Write / Preview** tabs, a **full-screen split view**, outlines to start from (blog post, project README, tutorial), word count and reading time.
- Images: use the **Image** button, or paste/drop them into the editor. They are uploaded to `data/uploads` and inserted as Markdown. Covers use the same uploader.

## Academic path and certifications

- `components/Academic.tsx` + `YearsStrip.tsx`: a Gantt-style **timeline** (each degree is a bar on a shared year axis, certifications are dots, animated counters), clean degree cards with a cursor glow, and a **credentials list** (issuer badge or your own image, date, ID, verify link).
- Manage certifications in Admin → Certifications (translatable like everything else).

## Contact form emails
Messages are always saved in **Admin → Messages**. To also get an email, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (and optionally `CONTACT_TO`) in `.env.local` (see `.env.example`), then restart. Messages that were emailed show "· emailed" in the admin.
