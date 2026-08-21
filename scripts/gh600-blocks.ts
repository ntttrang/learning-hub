/**
 * Donor topic-body HTML → hub lesson blocks (GH-600 pack).
 *
 * The donor study plan renders each topic body from a fixed, census-verified
 * vocabulary: <p>, callout c-key/c-fact/c-tip/c-warn, table.cmp-table,
 * ul.fact-list, div.code-block, div.ap-row pairs, plus the inline tags
 * strong/em/code. Anything else throws — this converter changes
 * representation, never content.
 */
import type { Block, CoreBlock } from '../src/sdk/types';

/* --------------------------------- inline --------------------------------- */

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
};

export function decodeEntities(text: string): string {
  return text.replace(/&([a-z#0-9]+);/g, (match, entity: string) => ENTITIES[entity] ?? match);
}

/** Inline HTML (strong/em/code/br) → markdown; unknown tags throw. */
export function inlineToMarkdown(html: string): string {
  const stripped = html
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/g, (_m, inner: string) => `\`${inner}\``)
    .replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**')
    .replace(/<em>([\s\S]*?)<\/em>/g, '_$1_')
    .replace(/<br\s*\/?>/g, '\n');
  const leftover = stripped.match(/<\/?[a-z][^>]*>/i);
  if (leftover) {
    throw new Error(`donor drift: unhandled inline tag "${leftover[0]}" in "${stripped.slice(0, 80)}"`);
  }
  return decodeEntities(stripped).trim();
}

/* ------------------------------- sub-patterns ------------------------------ */

function cmpTable(inner: string): CoreBlock {
  const rows = [...inner.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((row) =>
    [...row[1].matchAll(/<t[hd]>([\s\S]*?)<\/t[hd]>/g)].map((cell) => inlineToMarkdown(cell[1])),
  );
  if (rows.length < 2 || rows.some((row) => row.length !== rows[0].length)) {
    throw new Error(`donor drift: malformed cmp-table (${rows.length} rows)`);
  }
  return { kind: 'table', headers: rows[0], rows: rows.slice(1) };
}

function factList(inner: string): CoreBlock {
  const items = [...inner.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((li) =>
    inlineToMarkdown(li[1].replace(/^<span class="fi">[^<]*<\/span>/, '')),
  );
  if (items.length === 0) throw new Error('donor drift: empty fact-list');
  return { kind: 'list', items };
}

/** Highlight spans (cm comment / ck key / cs string) unwrap to plain text. */
function codeBlock(inner: string): CoreBlock {
  const text = inner.replace(/<span class="c[a-z]">([\s\S]*?)<\/span>/g, '$1');
  const leftover = text.match(/<span[^>]*>/i);
  if (leftover) throw new Error(`donor drift: unhandled span "${leftover[0]}" in code block`);
  const code = decodeEntities(text).replace(/\n{3,}/g, '\n\n').trimEnd();
  return { kind: 'code', language: detectLanguage(code), code };
}

/** yaml when unquoted `key:` lines lead; json when quoted keys appear; else text. */
export function detectLanguage(code: string): string {
  if (/"[\w.-]+"\s*:/.test(code)) return 'json';
  if (/^\s*-?\s*[\w./-]+:(\s|$)/m.test(code)) return 'yaml';
  return 'text';
}

// ap-row = one bad/good pair; consecutive rows merge into a single table.
const AP_ROW =
  /^<div class="ap-row">\s*<div class="ap-bad"><div class="ap-label">[\s\S]*?<\/div>([\s\S]*?)<\/div>\s*<div class="ap-good"><div class="ap-label">[\s\S]*?<\/div>([\s\S]*?)<\/div>\s*<\/div>/;

/* ------------------------------ top-level walk ----------------------------- */

/** Convert one donor topic body into ordered lesson blocks. */
export function convertBody(html: string): Block[] {
  const blocks: Block[] = [];
  let rest = html.trim();

  const take = (pattern: RegExp): RegExpMatchArray | null => {
    const trimmed = rest.replace(/^\s+/, '');
    const match = pattern.exec(trimmed);
    if (!match || match.index !== 0) return null;
    rest = trimmed.slice(match[0].length);
    return match;
  };

  for (;;) {
    rest = rest.replace(/^\s+/, '');
    if (rest.length === 0) return blocks;

    let match: RegExpMatchArray | null;
    if ((match = take(/^<p>([\s\S]*?)<\/p>/))) {
      blocks.push({ kind: 'md', body: inlineToMarkdown(match[1]) });
    } else if ((match = take(/^<div class="callout c-\w+">([\s\S]*?)<\/div>/))) {
      blocks.push({ kind: 'tip', text: inlineToMarkdown(match[1]) });
    } else if ((match = take(/^<table class="cmp-table">([\s\S]*?)<\/table>/))) {
      blocks.push(cmpTable(match[1]));
    } else if ((match = take(/^<ul class="fact-list">([\s\S]*?)<\/ul>/))) {
      blocks.push(factList(match[1]));
    } else if ((match = take(/^<div class="code-block">([\s\S]*?)<\/div>/))) {
      blocks.push(codeBlock(match[1]));
    } else if (AP_ROW.test(rest)) {
      const rows: string[][] = [];
      while ((match = take(AP_ROW))) {
        rows.push([inlineToMarkdown(match[1]), inlineToMarkdown(match[2])]);
      }
      blocks.push({ kind: 'table', headers: ['Anti-pattern', 'Correct'], rows });
    } else {
      throw new Error(`donor drift: unknown top-level markup "${rest.slice(0, 60)}"`);
    }
  }
}
