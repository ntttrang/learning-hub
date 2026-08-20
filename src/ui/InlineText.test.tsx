import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocResolverProvider, registryResolver } from './doc-context';
import { extractDocIds, InlineText, parseInline } from './InlineText';

const RESOLVE = (docId: string) =>
  docId === 'ms-lakehouse-doc'
    ? { title: 'Lakehouse docs', url: 'https://example.com/docs/lakehouse' }
    : undefined;

describe('parseInline tokenizer', () => {
  it('splits code, bold, and plain text', () => {
    expect(parseInline('a `b` c')).toEqual([
      { kind: 'text', text: 'a ' },
      { kind: 'code', text: 'b' },
      { kind: 'text', text: ' c' },
    ]);
    expect(parseInline('x **y** z')).toEqual([
      { kind: 'text', text: 'x ' },
      { kind: 'bold', text: 'y' },
      { kind: 'text', text: ' z' },
    ]);
  });

  it('tokenizes docId links — never raw URLs', () => {
    expect(parseInline('see [the docs](ms-lakehouse-doc)')).toEqual([
      { kind: 'text', text: 'see ' },
      { kind: 'link', text: 'the docs', docId: 'ms-lakehouse-doc' },
    ]);
    expect(parseInline('[label](https://example.com)')[0].kind).toBe('text');
  });

  it('renders unclosed markers literally', () => {
    expect(parseInline('an `unclosed tick')).toEqual([{ kind: 'text', text: 'an `unclosed tick' }]);
    expect(parseInline('**bold without end')).toEqual([
      { kind: 'text', text: '**bold without end' },
    ]);
  });

  it('tokenizes adjacent markers back to back', () => {
    expect(parseInline('`a`**b**')).toEqual([
      { kind: 'code', text: 'a' },
      { kind: 'bold', text: 'b' },
    ]);
  });

  it('stays flat — markers inside a token stay literal', () => {
    expect(parseInline('`**x**`')).toEqual([{ kind: 'code', text: '**x**' }]);
    expect(parseInline('**`x`**')).toEqual([{ kind: 'bold', text: '`x`' }]);
  });

  it('ignores single asterisks and non-docId link targets', () => {
    expect(parseInline('a *b* c')).toEqual([{ kind: 'text', text: 'a *b* c' }]);
    expect(parseInline('[x](Doc_A)')).toEqual([{ kind: 'text', text: '[x](Doc_A)' }]);
    expect(parseInline('[x](my_doc)')).toEqual([{ kind: 'text', text: '[x](my_doc)' }]);
  });

  it('returns no tokens for empty prose', () => {
    expect(parseInline('')).toEqual([]);
  });

  it('extracts docIds for integrity checks', () => {
    expect(extractDocIds('a [x](doc-a) and [y](doc-b)')).toEqual(['doc-a', 'doc-b']);
    expect(extractDocIds('no links, just `code` and **bold**')).toEqual([]);
  });
});

describe('InlineText rendering', () => {
  it('renders code, bold, and resolved links', () => {
    render(<InlineText text="use `SELECT`, **carefully**, per [the docs](ms-lakehouse-doc)" resolveDoc={RESOLVE} />);
    expect(screen.getByText('SELECT').tagName).toBe('CODE');
    expect(screen.getByText('carefully').tagName).toBe('STRONG');
    const link = screen.getByRole('link', { name: 'the docs' });
    expect(link.getAttribute('href')).toBe('https://example.com/docs/lakehouse');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.getAttribute('title')).toBe('Lakehouse docs');
  });

  it('degrades unknown docIds to plain text — never a dead anchor', () => {
    render(<InlineText text="see [ghost](no-such-doc)" resolveDoc={RESOLVE} />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('see')).toBeInTheDocument();
    expect(screen.getByText('ghost').tagName).toBe('SPAN');
  });

  it('resolves links through the ambient doc-resolver context', () => {
    render(
      <DocResolverProvider resolveDoc={RESOLVE}>
        <InlineText text="[the docs](ms-lakehouse-doc)" />
      </DocResolverProvider>,
    );
    expect(screen.getByRole('link', { name: 'the docs' })).toHaveAttribute(
      'href',
      'https://example.com/docs/lakehouse',
    );
  });

  it('without any resolver, links degrade to text', () => {
    render(<InlineText text="[the docs](ms-lakehouse-doc)" />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('degrades a registry url with a non-http scheme to literal text', () => {
    render(
      <InlineText
        text="see [the trap](evil-doc)"
        resolveDoc={() => ({ title: 'Evil', url: 'data:text/html,<b>owned</b>' })}
      />,
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('the trap').tagName).toBe('SPAN');
  });

  it('prefers an explicit resolver over the ambient context', () => {
    const contextResolve: typeof RESOLVE = (docId) =>
      docId === 'ctx-doc' ? { title: 'Context', url: 'https://example.com/ctx' } : undefined;
    render(
      <DocResolverProvider resolveDoc={contextResolve}>
        <InlineText
          text="[ctx link](ctx-doc) and [prop link](prop-doc)"
          resolveDoc={(docId) =>
            docId === 'prop-doc' ? { title: 'Prop', url: 'https://example.com/prop' } : undefined
          }
        />
      </DocResolverProvider>,
    );
    expect(screen.queryByRole('link', { name: 'ctx link' })).toBeNull();
    expect(screen.getByRole('link', { name: 'prop link' })).toHaveAttribute(
      'href',
      'https://example.com/prop',
    );
  });
});

describe('registryResolver', () => {
  const DOCS = {
    'gh-docs': { title: 'GH docs', url: 'https://example.com/gh' },
  };

  it('adapts a docs record into a lookup; unknown keys stay undefined', () => {
    const resolve = registryResolver(DOCS);
    expect(resolve?.('gh-docs')).toEqual({ title: 'GH docs', url: 'https://example.com/gh' });
    expect(resolve?.('ghost')).toBeUndefined();
  });

  it('returns no resolver without a registry', () => {
    expect(registryResolver(undefined)).toBeUndefined();
  });

  it('wires a docs record through the provider into InlineText', () => {
    const resolve = registryResolver(DOCS);
    if (!resolve) throw new Error('registryResolver must return a resolver for a non-empty record');
    render(
      <DocResolverProvider resolveDoc={resolve}>
        <InlineText text="[the docs](gh-docs) and [ghost](missing-doc)" />
      </DocResolverProvider>,
    );
    const link = screen.getByRole('link', { name: 'the docs' });
    expect(link.getAttribute('href')).toBe('https://example.com/gh');
    expect(link.getAttribute('title')).toBe('GH docs');
    expect(screen.queryByRole('link', { name: 'ghost' })).toBeNull();
  });
});
