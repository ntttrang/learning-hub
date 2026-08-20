/**
 * `npm run content:check` — every installed content pack must pass the full
 * pipeline (files → glob → Zod shape → graph validation → registry coverage).
 * One failing pack fails the build, so schema changes and pack edits meet
 * here first.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  assembleSubject,
  ContentValidationError,
  loadSubjectsTolerant,
  type RawContentFile,
} from '../sdk/content-source';
import { assertKindsRegistered } from '../sdk/registry/coverage';
import { contentSource, loadAllContent } from './registry';
// DP-800 block renderers register on import. This gate's module graph
// excludes the app entry, so the registration seam is imported here
// directly; App.tsx carries it for the app and App-rendering tests.
import './dp-800/renderers';

describe('content:check — every installed pack validates', () => {
  it('at least one pack is installed', () => {
    expect(contentSource.listSubjects().length).toBeGreaterThan(0);
  });

  it('every pack loads and validates clean', () => {
    // loadSubject throws ContentValidationError on any schema or contract issue.
    expect(() => loadAllContent()).not.toThrow();
    expect(loadAllContent().length).toBeGreaterThan(0);
  });

  it('every used block and question kind has a registered handler', () => {
    for (const content of loadAllContent()) {
      expect(() => assertKindsRegistered(content)).not.toThrow();
    }
  });
});

/* ---------------------- strict/lenient split (>=2 packs) --------------------- */

// Two synthetic packs sharing one loader: healthy + invalid. A fixture-only
// corruption test cannot prove isolation — with a single pack the list empties
// and `length > 0` fails for the wrong reason.
function packFiles(id: string, accent: string): RawContentFile[] {
  return [
    { path: `content/${id}/subject.json`, data: { id, code: id.toUpperCase(), title: id, accent, enabledModes: ['learn'] } },
    { path: `content/${id}/domains.json`, data: [{ id: 'd1', order: 1, title: 'D1' }] },
    { path: `content/${id}/lessons/l1.json`, data: { id: 'l1', domainId: 'd1', title: 'Lesson', minutes: 5, blocks: [{ kind: 'md', body: 'text' }] } },
  ];
}

describe('content:check — strict/lenient split', () => {
  const load = (id: string) =>
    assembleSubject(id, packFiles(id, id === 'bad-pack' ? 'neon-purple' : 'sky-cyan')).subject;

  it('a valid pack still lists when its sibling is invalid (tolerant path)', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const listed = loadSubjectsTolerant(['bad-pack', 'good-pack'], load);
      expect(listed.map((s) => s.id)).toEqual(['good-pack']);
      expect(error).toHaveBeenCalledTimes(1);
      expect(error.mock.calls[0][0]).toContain('bad-pack');
      expect(error.mock.calls[0][0]).toContain('subject.json');
    } finally {
      error.mockRestore();
    }
  });

  it('strict loading still throws on the invalid sibling — the gate keeps its teeth', () => {
    expect(() => ['bad-pack', 'good-pack'].map(load)).toThrow(ContentValidationError);
  });
});
