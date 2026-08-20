import type { ReactNode } from 'react';
import { Callout } from '../../ui/Callout';
import { CodeBlock } from '../../ui/CodeBlock';
import { DataTable } from '../../ui/DataTable';
import { InlineText } from '../../ui/InlineText';
import { Markdown } from '../../ui/Markdown';
import type { Block, CoreBlock } from '../types';

/**
 * Block-kind registry — the extension point for lesson content. Core kinds
 * render brand-styled, semantic markup through the shared `ui/` primitives
 * (docId links resolve via the ambient doc-resolver context); packs and app
 * code register additional kinds, never by editing core code. The `sdk → ui`
 * import direction is sanctioned for these renderer files only — engines
 * never import `ui/`.
 */

export class UnknownBlockKindError extends Error {
  override readonly name = 'UnknownBlockKindError';
  readonly kind: string;
  constructor(kind: string, registered: string[]) {
    super(`unknown block kind "${kind}" (registered: ${registered.join(', ') || 'none'})`);
    this.kind = kind;
  }
}

export type BlockRenderer = (block: Block) => ReactNode;

const renderers = new Map<string, BlockRenderer>();

/**
 * Register a block kind and its renderer. Core kinds get a renderer narrowed
 * to their exact shape; extension kinds take the open `Block` form, since
 * their payload lives outside the core schema.
 */
export function registerBlockKind<K extends string>(
  kind: K,
  renderer: K extends CoreBlock['kind']
    ? (block: Extract<CoreBlock, { kind: K }>) => ReactNode
    : BlockRenderer,
): void {
  renderers.set(kind, renderer as BlockRenderer);
}

export function getBlockRenderer(kind: string): BlockRenderer {
  const renderer = renderers.get(kind);
  if (!renderer) throw new UnknownBlockKindError(kind, [...renderers.keys()]);
  return renderer;
}

export function registeredBlockKinds(): string[] {
  return [...renderers.keys()];
}

/** Render one block; callers key the element inside their lesson list. */
export function renderBlock(block: Block): ReactNode {
  return getBlockRenderer(block.kind)(block);
}

/* ------------------------- core kind renderers ----------------------------- */
/* Styled through the shared ui/ primitives; docId links inside prose resolve
 * via the doc-resolver context the mounting viewer provides. */

/** Anchor-friendly id for a heading: lowercase, dashed, stable. */
function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

registerBlockKind('md', ({ body }) => (
  <Markdown>{body.replace(/\r\n/g, '\n')}</Markdown>
));

registerBlockKind('heading', ({ text, level }) => {
  const Tag = (level && level >= 1 && level <= 6 ? `h${level}` : 'h2') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return (
    <Tag className="blk-heading" id={headingId(text)}>
      {text}
    </Tag>
  );
});

registerBlockKind('list', ({ items, ordered }) => {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag>
      {items.map((item, i) => (
        <li key={i}>
          <InlineText text={item} />
        </li>
      ))}
    </Tag>
  );
});

registerBlockKind('code', ({ language, code }) => (
  <CodeBlock code={code} language={language} />
));

registerBlockKind('tip', ({ text }) => <Callout text={text} />);

registerBlockKind('table', ({ headers, rows }) => (
  <DataTable headers={headers} rows={rows} />
));
