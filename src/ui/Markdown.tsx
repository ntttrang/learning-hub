import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import type { ReactNode } from 'react';
import type { DocRegistry } from '../sdk/types';
import { useDocResolver } from './doc-context';
import { isExternalUrl } from './external-url';

interface MarkdownProps {
  /** Raw markdown (GFM): `.mdx` lesson bodies, stems, explanations. */
  children: string;
  /** Explicit docs registry; defaults to the ambient doc-resolver context. */
  docs?: DocRegistry;
}

/**
 * Markdown viewer over the dp-800-proven stack: react-markdown + remark-gfm +
 * rehype-highlight. `[label](docId)` links resolve against the pack's docs
 * registry (prop or context); plain http(s) URLs pass through as external
 * links; anything unresolved renders as literal text — never a dead anchor.
 */
export function Markdown({ children, docs }: MarkdownProps) {
  const contextResolve = useDocResolver();

  const link = ({ href, children: linkChildren }: { href?: string; children?: ReactNode }) => {
    if (!href) return <>{linkChildren}</>;
    const doc = docs ? docs[href] : contextResolve?.(href);
    if (doc && isExternalUrl(doc.url)) {
      return (
        <a href={doc.url} target="_blank" rel="noopener noreferrer" title={doc.title}>
          {linkChildren}
        </a>
      );
    }
    if (isExternalUrl(href)) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {linkChildren}
        </a>
      );
    }
    return <>{linkChildren}</>;
  };

  return (
    <div className="md-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{ a: link }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
