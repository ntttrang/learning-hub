import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocResolverProvider } from './doc-context';
import { Markdown } from './Markdown';

const DOCS = {
  'ms-lakehouse-doc': { title: 'Lakehouse docs', url: 'https://example.com/docs/lakehouse' },
};

const BODY = [
  '## Storage layers',
  '',
  'Files are the **physical** layer, tables are `metadata`:',
  '',
  '- Parquet on object storage',
  '- Tables are metadata',
  '',
  '| Layer | Holds |',
  '| ----- | ----- |',
  '| Files | Bytes |',
  '',
  '```sql',
  "SELECT id FROM orders WHERE status = 'open';",
  '```',
  '',
  'See [the lakehouse doc](ms-lakehouse-doc), [a ghost](no-such-doc), and [plain link](https://example.com/x).',
].join('\n');

describe('Markdown', () => {
  it('renders GFM prose: heading, bold, inline code, list, table', () => {
    const { container } = render(<Markdown>{BODY}</Markdown>);
    expect(screen.getByRole('heading', { level: 2, name: 'Storage layers' })).toBeInTheDocument();
    expect(screen.getByText('physical').tagName).toBe('STRONG');
    expect(screen.getByText('metadata').tagName).toBe('CODE');
    expect(screen.getByText('Parquet on object storage').closest('ul')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Bytes' })).toBeInTheDocument();
    expect(container.querySelector('.md-prose')).toBeInTheDocument();
  });

  it('highlights fenced code with hljs token spans', () => {
    const { container } = render(<Markdown>{BODY}</Markdown>);
    const keywords = Array.from(container.querySelectorAll('.hljs-keyword')).map(
      (el) => el.textContent,
    );
    expect(keywords).toContain('SELECT');
    expect(container.querySelector('.hljs-string')?.textContent).toBe("'open'");
  });

  it('resolves docId links against the docs registry', () => {
    render(
      <Markdown docs={DOCS}>
        {'See [the lakehouse doc](ms-lakehouse-doc).'}
      </Markdown>,
    );
    const link = screen.getByRole('link', { name: 'the lakehouse doc' });
    expect(link.getAttribute('href')).toBe('https://example.com/docs/lakehouse');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.getAttribute('title')).toBe('Lakehouse docs');
  });

  it('passes plain http(s) URLs through as external links', () => {
    render(
      <Markdown docs={DOCS}>
        {'See [plain link](https://example.com/x).'}
      </Markdown>,
    );
    const link = screen.getByRole('link', { name: 'plain link' });
    expect(link.getAttribute('href')).toBe('https://example.com/x');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders unresolved docIds as literal text — never a dead anchor', () => {
    render(
      <Markdown docs={DOCS}>
        {'See [a ghost](no-such-doc).'}
      </Markdown>,
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText(/a ghost/)).toBeInTheDocument();
  });

  it('renders blockquotes and thematic breaks as real elements', () => {
    const { container } = render(
      <Markdown>{'> A quoted warning.\n\n---\n\nAfter the break.'}</Markdown>,
    );
    expect(container.querySelector('blockquote')?.textContent?.trim()).toBe('A quoted warning.');
    expect(container.querySelector('hr')).toBeInTheDocument();
    expect(screen.getByText('After the break.')).toBeInTheDocument();
  });

  it('renders the h1 and h6 boundary levels', () => {
    render(<Markdown>{'# Top level\n\n###### Fine print'}</Markdown>);
    expect(screen.getByRole('heading', { level: 1, name: 'Top level' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 6, name: 'Fine print' })).toBeInTheDocument();
  });

  it('renders fenced code in an unregistered language as plain text — no crash', () => {
    const { container } = render(<Markdown>{'```zzz\nraw ~~~ content\n```'}</Markdown>);
    expect(container.querySelectorAll('.hljs-keyword')).toHaveLength(0);
    expect(container.querySelector('pre')?.textContent).toContain('raw ~~~ content');
  });

  it('resolves docId links through the ambient doc-resolver context', () => {
    render(
      <DocResolverProvider
        resolveDoc={(docId) =>
          docId === 'ms-lakehouse-doc'
            ? { title: 'Lakehouse docs', url: 'https://example.com/docs/lakehouse' }
            : undefined
        }
      >
        <Markdown>{'See [the lakehouse doc](ms-lakehouse-doc).'}</Markdown>
      </DocResolverProvider>,
    );
    const link = screen.getByRole('link', { name: 'the lakehouse doc' });
    expect(link.getAttribute('href')).toBe('https://example.com/docs/lakehouse');
    expect(link.getAttribute('title')).toBe('Lakehouse docs');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('treats an empty docs registry as authoritative — it overrides the context', () => {
    render(
      <DocResolverProvider
        resolveDoc={() => ({ title: 'Ctx', url: 'https://example.com/ctx' })}
      >
        <Markdown docs={{}}>{'See [the lakehouse doc](ms-lakehouse-doc).'}</Markdown>
      </DocResolverProvider>,
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText(/the lakehouse doc/)).toBeInTheDocument();
  });

  it('renders a link with no destination as plain text', () => {
    const { container } = render(
      <Markdown docs={DOCS}>
        {'An [empty]() destination.'}
      </Markdown>,
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(container.querySelector('p')?.textContent).toBe('An empty destination.');
  });

  it('renders non-http schemes like mailto as literal text — never an anchor', () => {
    const { container } = render(
      <Markdown docs={DOCS}>
        {'Write [support](mailto:help@example.com).'}
      </Markdown>,
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(container.querySelector('p')?.textContent).toBe('Write support.');
  });

  it('treats an uppercase scheme as external too', () => {
    render(
      <Markdown>{'See [secure link](HTTPS://example.com/up).'}</Markdown>,
    );
    const link = screen.getByRole('link', { name: 'secure link' });
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('degrades a registry url with a non-http scheme — no anchor, no script href', () => {
    const { container } = render(
      <Markdown docs={{ 'evil-doc': { title: 'Evil', url: 'javascript:alert(1)' } }}>
        {'See [the trap](evil-doc).'}
      </Markdown>,
    );
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('p')?.textContent).toBe('See the trap.');
  });
});
