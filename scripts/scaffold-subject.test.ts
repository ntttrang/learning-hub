/**
 * The scaffolder's contract: a stamped pack is real content — it validates
 * through the same assemble + graph pipeline `content:check` runs, and its
 * ids cross-resolve. The template is the thing under test; when the schema
 * evolves, fix the template here, never the schema.
 */
import { describe, expect, it } from 'vitest';
import { assembleSubject, type RawContentFile } from '../src/sdk/content-source';
import { assertValidOptions, buildStarterPack } from './scaffold-subject';
import type { ScaffoldOptions } from './scaffold-subject';
import type { AccentToken, Question, Subject } from '../src/sdk/types';

/** The stamped question is always kind: single — narrow the union for reads. */
type SingleQuestion = Extract<Question, { kind: 'single' }>;

const base: ScaffoldOptions = {
  id: 'az-900-style',
  code: 'AZ-900',
  title: 'Cloud fundamentals',
  accent: 'deep-teal',
  subtitle: 'Cloud · 1 domain',
  description: 'A scaffolded starter pack for cloud fundamentals.',
};

/** Build the file map the Vite glob would discover, as RawContentFiles. */
const rawFiles = (opts: ScaffoldOptions): RawContentFile[] =>
  Object.entries(buildStarterPack(opts)).map(([path, contents]) => ({
    path: `content/${opts.id}/${path}`,
    // .json arrives eager-parsed through the glob; .mdx stays a raw string.
    data: path.endsWith('.json') ? JSON.parse(contents) : contents,
  }));

const parseJson = <T,>(raw: string): T => JSON.parse(raw) as T;

describe('buildStarterPack', () => {
  it('stamps exactly the agreed file set', () => {
    expect(Object.keys(buildStarterPack(base)).sort()).toEqual(
      [
        'comparisons.json',
        'domains.json',
        'exams.json',
        'labs.json',
        'modules.json',
        'questions/welcome.json',
        'subject.json',
        'lessons/welcome.mdx',
      ].sort(),
    );
  });

  it('assembles and graph-validates clean through the content:check pipeline', () => {
    const content = assembleSubject(base.id, rawFiles(base));
    expect(content.subject.code).toBe('AZ-900');
    expect(content.domains).toHaveLength(1);
    expect(content.modules).toHaveLength(1);
    expect(content.lessons).toHaveLength(1);
    expect(content.questions).toHaveLength(1);
    expect(content.labs).toEqual([]);
    expect(content.exams).toEqual([]);
    expect(content.comparisons).toEqual([]);
  });

  it('exposes only the modes it has content for', () => {
    const files = buildStarterPack(base);
    const subject = parseJson<Subject>(files['subject.json']!);
    expect(subject.enabledModes).toEqual(['learn', 'practice']);
    // practice needs questions, learn needs lessons — both are stamped.
    const question = parseJson<SingleQuestion>(files['questions/welcome.json']!);
    expect(question.kind).toBe('single');
    expect(question.options.length).toBeGreaterThan(1);
    expect(question.options.some((option) => option.id === question.correct)).toBe(true);
  });

  it('cross-resolves: question → lesson → module → domain, frontmatter included', () => {
    const content = assembleSubject(base.id, rawFiles(base));
    const question = content.questions[0]!;
    const lesson = content.lessons[0]!;
    expect(question.lessonId).toBe(lesson.id);
    expect(content.modules[0]!.id).toBe(lesson.moduleId);
    expect(content.domains[0]!.id).toBe(lesson.domainId);
    // The MDX frontmatter survived parsing (slug + a body block).
    expect(lesson.slug).toBe('welcome');
    expect(lesson.blocks.length).toBeGreaterThan(0);
  });

  it('rejects bad ids, empty fields, and unknown accents', () => {
    expect(() => assertValidOptions({ ...base, id: 'Not_Kebab' })).toThrow(/kebab-case/);
    expect(() => assertValidOptions({ ...base, id: 'a--b' })).toThrow(/kebab-case/);
    expect(() => assertValidOptions({ ...base, code: '  ' })).toThrow(/--code/);
    expect(() => assertValidOptions({ ...base, title: '' })).toThrow(/--title/);
    // Invalid accents only exist at the CLI boundary — cast past the token type.
    expect(() => assertValidOptions({ ...base, accent: 'hot-pink' as AccentToken })).toThrow(
      /brand token/,
    );
  });

  it('uses every brand accent token the schema allows', () => {
    // The flag surface must accept the full locked token list — a new token
    // landing in ACCENT_TOKENS is not a scaffolder change.
    const accents: AccentToken[] = [
      'sky-cyan',
      'hub-green',
      'corgi-orange',
      'hub-coral',
      'petal-pink',
      'deep-teal',
      'captain-red',
    ];
    for (const accent of accents) {
      expect(() => buildStarterPack({ ...base, accent })).not.toThrow();
    }
  });
});
