import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import hljs from 'highlight.js/lib/common';

interface CodeBlockProps {
  code: string;
  /** Language id for highlighting (e.g. `sql`, `yaml`); unknown ids render plain. */
  language?: string;
  /** Chip label; defaults to the language id. */
  label?: string;
}

/** Highlight `code` when the language is registered; plain otherwise. */
function highlight(code: string, language?: string): string | undefined {
  if (!language || !hljs.getLanguage(language)) return undefined;
  try {
    return hljs.highlight(code, { language }).value;
  } catch {
    return undefined; // a malformed snippet must never crash the viewer
  }
}

/**
 * Terminal-style code block: label chip, copy button, and hljs token spans.
 * Markdown fenced code goes through rehype-highlight instead, but both emit
 * the same `.hljs-*` classes, so one token-mapped stylesheet covers both.
 */
export function CodeBlock({ code, language, label }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const html = highlight(code, language);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard may be unavailable — copying is a bonus, not a contract */
    }
  };

  return (
    <div className="codeblock">
      <div className="codeblock-head">
        <span className="codeblock-lang">{label ?? language ?? 'code'}</span>
        <button type="button" className="codeblock-copy" onClick={copy} aria-label="Copy code">
          {copied ? (
            <Check size={13} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Copy size={13} strokeWidth={1.75} aria-hidden="true" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="codeblock-pre">
        <code
          className={language ? `hljs language-${language}` : 'hljs'}
          data-language={language}
          {...(html ? { dangerouslySetInnerHTML: { __html: html } } : { children: code })}
        />
      </pre>
    </div>
  );
}
