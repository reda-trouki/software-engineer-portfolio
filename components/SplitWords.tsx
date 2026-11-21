// Splits a headline into masked words so GSAP can slide them up one by one.
// Server component: no JS needed to render, the animation layer finds [data-word].

export default function SplitWords({ text, highlight }: { text: string; highlight?: string }) {
  const start = highlight ? text.indexOf(highlight) : -1;
  const end = start >= 0 ? start + highlight!.length : -1;
  const words = Array.from(text.matchAll(/\S+/g)).map((m) => ({
    w: m[0],
    hot: start >= 0 && m.index! < end && m.index! + m[0].length > start,
  }));

  return (
    <>
      {words.map((x, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.1em] -mb-[0.1em]">
          <span data-word className={`inline-block will-change-transform ${x.hot ? 'font-serif text-[1.1em] font-normal italic tracking-normal text-accent' : ''}`}>{x.w}</span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  );
}
