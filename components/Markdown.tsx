import type { ComponentProps, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import CodeBlock from './CodeBlock';
import { idGenerator, plain } from '@/lib/toc';

const text = (n: ReactNode): string => (typeof n === 'string' || typeof n === 'number' ? String(n) : Array.isArray(n) ? n.map(text).join('') : n && typeof n === 'object' && 'props' in n ? text((n as { props: { children?: ReactNode } }).props.children) : '');

const prose = [
  'prose max-w-none',
  'prose-p:text-[17px] prose-p:leading-[1.85] prose-p:text-fg/85',
  'prose-li:text-[17px] prose-li:leading-[1.75] prose-li:text-fg/85 prose-li:marker:text-accent',
  'prose-headings:font-hd prose-headings:font-semibold prose-headings:text-fg prose-headings:tracking-[-0.02em]',
  'prose-strong:text-fg prose-a:text-accent prose-a:underline-offset-4 prose-a:decoration-accent/40 hover:prose-a:decoration-accent',
  'prose-code:rounded-md prose-code:bg-surface prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.88em] prose-code:font-normal prose-code:text-accent prose-code:before:content-none prose-code:after:content-none',
  'prose-hr:border-line2',
].join(' ');

export type MarkdownLabels = { copy: string; copied: string };

/**
 * One renderer for the public post page and the admin live preview.
 * Headings get anchor ids (matching extractToc), images become captioned figures,
 * code is highlighted with a copy button, tables scroll sideways on small screens.
 */
export default function Markdown({ source, labels, className = '' }: { source: string; labels?: MarkdownLabels; className?: string }) {
  const nextId = idGenerator();

  const heading = (Tag: 'h2' | 'h3') => function H({ children }: ComponentProps<'h2'>) {
    const id = nextId(plain(text(children)));
    return (
      <Tag id={id} className="group relative scroll-mt-28">
        {children}
        <a href={`#${id}`} aria-label="Link to this section" className="ms-2 inline-block text-accent no-underline opacity-0 transition-opacity group-hover:opacity-70 focus:opacity-100">#</a>
      </Tag>
    );
  };

  return (
    <div className={`${prose} ${className}`}>
      <ReactMarkdown
        rehypePlugins={[[rehypeHighlight, { detect: false, plainText: ['text', 'txt', 'plain'] }]]}
        components={{
          h2: heading('h2'),
          h3: heading('h3'),
          a: ({ href, children }) => <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{children}</a>,
          // an image alone on a line becomes a <figure>, which must not sit inside a <p>
          p: ({ node, children }) => (node?.children?.length === 1 && node.children[0].type === 'element' && node.children[0].tagName === 'img' ? <>{children}</> : <p>{children}</p>),
          img: ({ src, alt, title }) => (
            <figure className="not-prose my-9">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={typeof src === 'string' ? src : ''} alt={alt ?? ''} loading="lazy" className="w-full rounded-2xl border border-line2 bg-surface" />
              {(title || alt) && <figcaption className="mt-3 text-center font-mono text-xs text-muted">{title || alt}</figcaption>}
            </figure>
          ),
          blockquote: ({ children }) => <blockquote className="not-italic !border-s-[3px] !border-accent rounded-e-2xl bg-surface py-1 ps-6 pe-5 [&>p]:text-fg [&>p]:before:content-none [&>p]:after:content-none">{children}</blockquote>,
          table: ({ children }) => <div className="not-prose my-8 overflow-x-auto rounded-2xl border border-line2"><table className="w-full border-collapse text-start text-[15px] [&_td]:border-t [&_td]:border-line2 [&_td]:px-4 [&_td]:py-3 [&_th]:bg-surface [&_th]:px-4 [&_th]:py-3 [&_th]:text-start [&_th]:font-mono [&_th]:text-xs [&_th]:font-medium [&_th]:uppercase [&_th]:text-muted">{children}</table></div>,
          pre: ({ children }) => {
            const code = (children as { props?: { className?: string; children?: ReactNode } } | undefined)?.props;
            const lang = /language-([\w-]+)/.exec(code?.className ?? '')?.[1] ?? '';
            return <CodeBlock lang={lang} labels={labels}>{children}</CodeBlock>;
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
