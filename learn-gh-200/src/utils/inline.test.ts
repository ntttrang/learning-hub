import { describe, expect, it } from 'vitest';
import { extractDocIds, parseInline } from './inline';

describe('parseInline', () => {
  it('returns a single text token for plain prose', () => {
    expect(parseInline('just words')).toEqual([{ kind: 'text', text: 'just words' }]);
  });

  it('tokenizes a code span', () => {
    expect(parseInline('set the `GITHUB_TOKEN` env var')).toEqual([
      { kind: 'text', text: 'set the ' },
      { kind: 'code', text: 'GITHUB_TOKEN' },
      { kind: 'text', text: ' env var' },
    ]);
  });

  it('tokenizes bold text', () => {
    expect(parseInline('a **big idea** here')).toEqual([
      { kind: 'text', text: 'a ' },
      { kind: 'bold', text: 'big idea' },
      { kind: 'text', text: ' here' },
    ]);
  });

  it('tokenizes a doc link', () => {
    expect(parseInline('see [GitHub flow](github-flow) first')).toEqual([
      { kind: 'text', text: 'see ' },
      { kind: 'link', text: 'GitHub flow', docId: 'github-flow' },
      { kind: 'text', text: ' first' },
    ]);
  });

  it('mixes all three constructs in one string', () => {
    expect(parseInline('`git push` then **read** [the docs](about-git).')).toEqual([
      { kind: 'code', text: 'git push' },
      { kind: 'text', text: ' then ' },
      { kind: 'bold', text: 'read' },
      { kind: 'text', text: ' ' },
      { kind: 'link', text: 'the docs', docId: 'about-git' },
      { kind: 'text', text: '.' },
    ]);
  });

  it('renders unclosed markers literally', () => {
    expect(parseInline('a `unclosed and **bold')).toEqual([
      { kind: 'text', text: 'a `unclosed and **bold' },
    ]);
  });

  it('does not treat a raw URL as a link', () => {
    expect(parseInline('go [home](https://example.com) now')).toEqual([
      { kind: 'text', text: 'go [home](https://example.com) now' },
    ]);
  });

  it('keeps an unmatched open bracket as text', () => {
    expect(parseInline('array[0] and [oops]')).toEqual([
      { kind: 'text', text: 'array[0] and [oops]' },
    ]);
  });
});

describe('extractDocIds', () => {
  it('collects only link docIds, in order', () => {
    expect(extractDocIds('see [a](x-y) and `code` and [b](z-9)')).toEqual(['x-y', 'z-9']);
  });

  it('returns an empty array with no links', () => {
    expect(extractDocIds('plain `code` **only**')).toEqual([]);
  });
});
