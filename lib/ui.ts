// Shared Tailwind class strings (kept in one place so pages stay consistent).

export const wrap = 'mx-auto w-full max-w-[1120px] px-5 sm:px-8';
export const label = 'font-mono text-xs uppercase tracking-[0.14em] text-accent';
export const h2 = 'font-hd text-[clamp(26px,3.2vw,40px)] font-semibold leading-[1.1] tracking-[-0.03em] text-balance';
export const sectionPad = 'py-16 sm:py-24';
export const navLink = 'flex min-h-11 items-center text-[14px] text-muted transition-colors hover:text-fg';

export const btnBase =
  'inline-flex min-h-12 cursor-pointer items-center gap-2.5 rounded-full border border-transparent px-6 text-[14px] font-medium transition duration-200 hover:-translate-y-0.5';
export const btnPrimary = `${btnBase} bg-accent text-ink hover:brightness-110`;
export const btnGhost = `${btnBase} border-line2 text-fg hover:border-fg`;
export const btnInk = `${btnBase} bg-ink text-[#eceae3] hover:bg-[#1b1e24]`;

export const tagLight = 'inline-block rounded-full border border-ink/25 px-2.5 py-1 font-mono text-[11px]';
export const tagDark = 'inline-block rounded-full border border-line2 px-3 py-1.5 font-mono text-[11px] text-fg';
