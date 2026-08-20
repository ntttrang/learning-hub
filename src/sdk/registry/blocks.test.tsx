import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocResolverProvider } from '../../ui/doc-context';
import type { Block, ExtensionBlock } from '../types';
import { registerBlockKind, renderBlock, UnknownBlockKindError } from './blocks';

describe('core block renderers (shared ui/ primitives)', () => {
  it('md: renders markdown prose — paragraphs, headings, fences', () => {
    const body = 'First para.\n\n## Section head\n\nSecond para.';
    const { container } = render(<div>{renderBlock({ kind: 'md', body })}</div>);
    expect(screen.getByText('First para.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Section head' })).toBeInTheDocument();
    expect(screen.getByText('Second para.')).toBeInTheDocument();
    expect(container.querySelector('.md-prose')).toBeInTheDocument();
  });

  it('md: normalizes CRLF bodies before rendering', () => {
    render(<div>{renderBlock({ kind: 'md', body: 'Windows para.\r\n\r\nSecond.' })}</div>);
    expect(screen.getByText('Windows para.')).toBeInTheDocument();
    expect(screen.getByText('Second.')).toBeInTheDocument();
  });

  it('md: resolves docId links through the ambient doc-resolver context', () => {
    render(
      <DocResolverProvider
        resolveDoc={() => ({ title: 'Docs', url: 'https://example.com/d' })}
      >
        <div>{renderBlock({ kind: 'md', body: 'See [the docs](doc-a).' })}</div>
      </DocResolverProvider>,
    );
    const link = screen.getByRole('link', { name: 'the docs' });
    expect(link.getAttribute('href')).toBe('https://example.com/d');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('md: unresolved docIds degrade to text when no provider is mounted', () => {
    render(<div>{renderBlock({ kind: 'md', body: 'See [the ghost](no-such-doc).' })}</div>);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText(/the ghost/)).toBeInTheDocument();
  });

  it('heading: renders at the requested level with a stable anchor id', () => {
    render(<div>{renderBlock({ kind: 'heading', text: 'Section', level: 3 })}</div>);
    const heading = screen.getByRole('heading', { level: 3, name: 'Section' });
    expect(heading.id).toBe('section');
    expect(heading.className).toBe('blk-heading');
  });

  it('heading: falls back to h2 when the level is absent or out of range', () => {
    render(
      <div>
        {renderBlock({ kind: 'heading', text: 'No Level' })}
        {renderBlock({ kind: 'heading', text: 'Huge', level: 9 })}
        {renderBlock({ kind: 'heading', text: 'Zero', level: 0 })}
      </div>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'No Level' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Huge' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Zero' })).toBeInTheDocument();
  });

  it('heading: renders the h1 and h6 boundary levels with anchors', () => {
    render(
      <div>
        {renderBlock({ kind: 'heading', text: 'Course Title', level: 1 })}
        {renderBlock({ kind: 'heading', text: 'Fine print', level: 6 })}
      </div>,
    );
    const h1 = screen.getByRole('heading', { level: 1, name: 'Course Title' });
    const h6 = screen.getByRole('heading', { level: 6, name: 'Fine print' });
    expect(h1.className).toBe('blk-heading');
    expect(h1.id).toBe('course-title');
    expect(h6.className).toBe('blk-heading');
    expect(h6.id).toBe('fine-print');
  });

  it('heading: slugifies punctuation and spaces, trimming edge dashes', () => {
    render(
      <div>
        {renderBlock({ kind: 'heading', text: "What's new? Tools & Tips!", level: 2 })}
        {renderBlock({ kind: 'heading', text: '- Intro -', level: 2 })}
      </div>,
    );
    expect(screen.getByRole('heading', { name: "What's new? Tools & Tips!" }).id).toBe(
      'what-s-new-tools-tips',
    );
    expect(screen.getByRole('heading', { name: '- Intro -' }).id).toBe('intro');
  });

  it('list: ordered and unordered variants, items through the inline tokenizer', () => {
    render(
      <div>
        {renderBlock({ kind: 'list', items: ['one', 'run `gh pr`'], ordered: false })}
        {renderBlock({ kind: 'list', items: ['first', 'second'], ordered: true })}
      </div>,
    );
    expect(screen.getAllByRole('list')).toHaveLength(2); // the <ul> and the <ol>
    expect(screen.getByText('one').closest('ul')).toBeInTheDocument();
    expect(screen.getByText('second').closest('ol')).toBeInTheDocument();
    expect(screen.getByText('gh pr').tagName).toBe('CODE');
  });

  it('list: resolves docId links in items through the ambient context', () => {
    render(
      <DocResolverProvider
        resolveDoc={() => ({ title: 'Docs', url: 'https://example.com/d' })}
      >
        <div>{renderBlock({ kind: 'list', items: ['see [the docs](doc-a)'], ordered: false })}</div>
      </DocResolverProvider>,
    );
    const link = screen.getByRole('link', { name: 'the docs' });
    expect(link.closest('li')).toBeInTheDocument();
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('code: renders the CodeBlock with label chip and highlighted body', () => {
    const { container } = render(
      <div>{renderBlock({ kind: 'code', language: 'sql', code: 'SELECT 1;' })}</div>,
    );
    expect(container.querySelector('.codeblock')).toBeInTheDocument();
    expect(screen.getByText('sql').className).toBe('codeblock-lang');
    expect(container.querySelector('.codeblock-pre code')?.textContent).toBe('SELECT 1;');
    expect(container.querySelectorAll('.hljs-keyword').length).toBeGreaterThan(0);
  });

  it('code: unknown languages render plain, never crash', () => {
    const { container } = render(
      <div>{renderBlock({ kind: 'code', language: 'zzz', code: 'raw ~~~' })}</div>,
    );
    expect(container.querySelector('.codeblock-pre code')?.textContent).toBe('raw ~~~');
    expect(container.querySelectorAll('.hljs-keyword')).toHaveLength(0);
  });

  it('tip: renders as a note aside with the Tip label', () => {
    render(<div>{renderBlock({ kind: 'tip', text: 'Watch the grain.' })}</div>);
    expect(screen.getByRole('note')).toHaveTextContent('Watch the grain.');
    expect(screen.getByText('Tip')).toBeInTheDocument();
  });

  it('table: headers with column scope and body cells', () => {
    render(
      <div>
        {renderBlock({
          kind: 'table',
          headers: ['Engine', 'Storage'],
          rows: [
            ['Warehouse', 'Files'],
            ['Lakehouse', 'Delta'],
          ],
        })}
      </div>,
    );
    expect(screen.getByRole('columnheader', { name: 'Engine' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByRole('cell', { name: 'Delta' })).toBeInTheDocument();
  });

  it('table: ragged rows render defensively — no crash on short or long rows', () => {
    render(
      <div>
        {renderBlock({
          kind: 'table',
          headers: ['A', 'B'],
          rows: [['only-a'], ['a2', 'b2', 'overflow']],
        })}
      </div>,
    );
    const rows = screen.getAllByRole('row').map((row) => row as HTMLTableRowElement);
    expect(rows).toHaveLength(3); // header + 2 body rows, each normalized to width 2
    rows.slice(1).forEach((row) => expect(row.cells).toHaveLength(2));
    expect(screen.queryByText('overflow')).toBeNull();
  });
});

describe('block kind registry extension', () => {
  it('extension kinds register and render alongside core kinds', () => {
    registerBlockKind('test-callout', (block: ExtensionBlock) => <mark>{String(block.text)}</mark>);
    render(<div>{renderBlock({ kind: 'test-callout', text: 'New in v2' })}</div>);
    expect(screen.getByText('New in v2').tagName).toBe('MARK');
  });

  it('unknown kinds throw UnknownBlockKindError', () => {
    expect(() => renderBlock({ kind: 'nope' } as Block)).toThrow(UnknownBlockKindError);
  });
});
