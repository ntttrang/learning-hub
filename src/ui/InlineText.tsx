import { useDocResolver, type DocResolver } from './doc-context';
import { isExternalUrl } from './external-url';

/**
 * Mini inline-markup tokenizer for lesson, lab, and question prose, ported
 * from the gh-200 donor. Exactly three constructs:
 *
 *   `code`              → monospace token
 *   **bold**            → emphasis token (flat: no nesting inside bold)
 *   [label](docId)      → link token resolved against the docs registry
 *
 * Anything else is plain text. Unclosed markers render literally rather than
 * swallowing the rest of the string, and `[label](url)` with a raw URL is not
 * a link — docIds only, so every link resolves in exactly one place.
 */

export type InlineToken =
  | { kind: 'text'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'link'; text: string; docId: string };

/** A link label plus a docId (letters, digits, dashes — never a raw URL). */
const LINK_RE = /^\[([^\]]+)\]\(([a-z0-9-]+)\)/;

export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let plain = '';
  let i = 0;

  const flush = () => {
    if (plain.length > 0) {
      tokens.push({ kind: 'text', text: plain });
      plain = '';
    }
  };

  while (i < text.length) {
    const rest = text.slice(i);

    if (rest.startsWith('`')) {
      const close = rest.indexOf('`', 1);
      if (close > 0) {
        flush();
        tokens.push({ kind: 'code', text: rest.slice(1, close) });
        i += close + 1;
        continue;
      }
    }

    if (rest.startsWith('**')) {
      const close = rest.indexOf('**', 2);
      if (close > 0) {
        flush();
        tokens.push({ kind: 'bold', text: rest.slice(2, close) });
        i += close + 2;
        continue;
      }
    }

    const link = LINK_RE.exec(rest);
    if (link) {
      flush();
      tokens.push({ kind: 'link', text: link[1], docId: link[2] });
      i += link[0].length;
      continue;
    }

    plain += text[i];
    i += 1;
  }

  flush();
  return tokens;
}

/** Every docId a piece of prose links to — feeds content integrity checks. */
export function extractDocIds(text: string): string[] {
  return parseInline(text)
    .filter((token) => token.kind === 'link')
    .map((token) => (token as { kind: 'link'; text: string; docId: string }).docId);
}

/**
 * Render the three inline constructs inside one string of prose. Doc links
 * open in a new tab and title themselves with the registry entry so a hover
 * says where you're going. Unknown docIds degrade to plain text rather than
 * a dead link.
 */
export function InlineText({
  text,
  resolveDoc: resolveDocProp,
}: {
  text: string;
  /** Explicit resolver; defaults to the ambient doc-resolver context. */
  resolveDoc?: DocResolver;
}) {
  const contextResolve = useDocResolver();
  const resolveDoc = resolveDocProp ?? contextResolve;

  return (
    <>
      {parseInline(text).map((token, index) => {
        switch (token.kind) {
          case 'code':
            return <code key={index}>{token.text}</code>;
          case 'bold':
            return <strong key={index}>{token.text}</strong>;
          case 'link': {
            const doc = resolveDoc?.(token.docId);
            if (!doc || !isExternalUrl(doc.url)) return <span key={index}>{token.text}</span>;
            return (
              <a
                key={index}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                title={doc.title}
              >
                {token.text}
              </a>
            );
          }
          default:
            return <span key={index}>{token.text}</span>;
        }
      })}
    </>
  );
}
