import { describe, expect, it } from 'vitest';
import {
  assembleSubject,
  ContentValidationError,
  createFileContentSource,
  createSubjectIndex,
  parseContentPath,
  type RawContentFile,
} from './content-source';

/* ------------------------------ path parsing ------------------------------ */

describe('parseContentPath', () => {
  it.each([
    ['content/fixture/subject.json', { subjectId: 'fixture', collection: 'subject', entryKey: 'subject' }],
    ['content/dp-800/domains.json', { subjectId: 'dp-800', collection: 'domains', entryKey: 'domains' }],
    ['content/fixture/docs.json', { subjectId: 'fixture', collection: 'docs', entryKey: 'docs' }],
    [
      'content/fixture/questions/q-single.json',
      { subjectId: 'fixture', collection: 'questions', entryKey: 'q-single' },
    ],
    [
      'content/fixture/lessons/storage-models.mdx',
      { subjectId: 'fixture', collection: 'lessons', entryKey: 'storage-models' },
    ],
  ])('%s -> %j', (path, expected) => {
    expect(parseContentPath(path)).toEqual(expected);
  });

  it('normalizes a leading slash', () => {
    expect(parseContentPath('/content/fixture/subject.json').subjectId).toBe('fixture');
  });

  it.each([
    ['content/fixture/unknown.json', /unknown content file/],
    ['content/fixture/unknown/x.json', /unknown content folder/],
    ['content/fixture/questions/sub/x.json', /directly inside its collection folder/],
    ['subject.json', /content\/<subject>/],
  ])('%s throws %s', (path, pattern) => {
    expect(() => parseContentPath(path)).toThrow(pattern);
  });
});

/* --------------------------- real fixture on disk --------------------------- */

const source = createFileContentSource();

describe('FileContentSource over content/fixture', () => {
  it('lists the fixture subject', () => {
    expect(source.listSubjects().map((s) => s.id)).toContain('fixture');
  });

  it('loads the pack clean through the full pipeline', () => {
    const content = source.loadSubject('fixture');
    expect(content.subject.accent).toBe('sky-cyan');
    expect(content.questions).toHaveLength(7);
    expect(content.exams[0].selection).toMatchObject({ kind: 'sampled', seed: 42 });
    expect(content.comparisons[0].columns).toHaveLength(3);
  });

  it('throws a typed error for an unknown subject', () => {
    expect(() => source.loadSubject('ghost')).toThrow(ContentValidationError);
  });
});

describe('mdx lesson assembly', () => {
  const content = source.loadSubject('fixture');

  it('frontmatter metadata lands on the lesson', () => {
    const mdx = content.lessons.find((l) => l.id === 'lesson-storage-models');
    expect(mdx).toBeDefined();
    expect(mdx).toMatchObject({
      domainId: 'd1',
      moduleId: 'm-storage',
      slug: 'storage-models',
      minutes: 12,
      flagship: true,
      labId: 'lab-explore',
      questionIds: ['q-single', 'q-multi', 'q-order'],
    });
  });

  it('the body becomes one trailing md block', () => {
    const mdx = content.lessons.find((l) => l.id === 'lesson-storage-models')!;
    expect(mdx.blocks).toHaveLength(1);
    expect(mdx.blocks[0]).toMatchObject({ kind: 'md' });
    expect((mdx.blocks[0] as { body: string }).body).toContain('where do the bytes live');
  });

  it('both lesson source formats normalize to the same Lesson shape', () => {
    const json = content.lessons.find((l) => l.id === 'lesson-query-shapes')!;
    const mdx = content.lessons.find((l) => l.id === 'lesson-storage-models')!;
    for (const lesson of [json, mdx]) {
      expect(typeof lesson.id).toBe('string');
      expect(typeof lesson.domainId).toBe('string');
      expect(typeof lesson.title).toBe('string');
      expect(lesson.minutes).toBeGreaterThan(0);
      expect(lesson.blocks.length).toBeGreaterThan(0);
      expect(lesson.blocks.every((b) => typeof b.kind === 'string')).toBe(true);
    }
    // json keeps its structured blocks; mdx carries exactly one md block.
    expect(json.blocks.map((b) => b.kind)).toEqual(['heading', 'md', 'list', 'code', 'tip', 'table']);
    expect(mdx.blocks.map((b) => b.kind)).toEqual(['md']);
  });
});

/* ------------------------------- broken input ------------------------------ */

const validSubject = {
  id: 'broken',
  code: 'BR-1',
  title: 'Broken',
  accent: 'hub-coral',
  enabledModes: ['learn'],
};
const validDomains = [{ id: 'd1', order: 1, title: 'D1' }];
const validLesson = {
  id: 'l1',
  domainId: 'd1',
  title: 'Lesson',
  minutes: 5,
  blocks: [{ kind: 'md', body: 'text' }],
};

function baseFiles(): RawContentFile[] {
  return [
    { path: 'content/broken/subject.json', data: { ...validSubject } },
    { path: 'content/broken/domains.json', data: JSON.parse(JSON.stringify(validDomains)) },
    { path: 'content/broken/lessons/l1.json', data: JSON.parse(JSON.stringify(validLesson)) },
  ];
}

const wrap = (files: RawContentFile[]) => assembleSubject('broken', files);

describe('assembleSubject error classes', () => {
  it('clean minimal pack passes', () => {
    expect(wrap(baseFiles())).toBeDefined();
  });

  it('schema error: bad accent token, with file+field path', () => {
    const files = baseFiles();
    (files[0].data as Record<string, unknown>).accent = 'neon-purple';
    expect(() => wrap(files)).toThrow(ContentValidationError);
    try {
      wrap(files);
      expect.unreachable('should have thrown');
    } catch (error) {
      const issues = (error as ContentValidationError).issues;
      expect(issues).toContainEqual(
        expect.objectContaining({ code: 'schema', path: expect.stringContaining('subject.json') }),
      );
    }
  });

  it('missing subject.json is reported', () => {
    const files = baseFiles().slice(1);
    try {
      wrap(files);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as ContentValidationError).issues).toContainEqual(
        expect.objectContaining({ code: 'missing-file' }),
      );
    }
  });

  it('subject id must match its directory', () => {
    const files = baseFiles();
    (files[0].data as Record<string, unknown>).id = 'not-broken';
    try {
      wrap(files);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as ContentValidationError).issues).toContainEqual(
        expect.objectContaining({ code: 'schema', message: expect.stringContaining('does not match') }),
      );
    }
  });

  it('path error: unknown collection file', () => {
    const files = [...baseFiles(), { path: 'content/broken/oops.json', data: {} }];
    try {
      wrap(files);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as ContentValidationError).issues).toContainEqual(
        expect.objectContaining({ code: 'path', path: 'content/broken/oops.json' }),
      );
    }
  });

  it('graph errors flow through: unknown domain on lesson', () => {
    const files = baseFiles();
    (files[2].data as Record<string, unknown>).domainId = 'nope';
    try {
      wrap(files);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as ContentValidationError).issues).toContainEqual(
        expect.objectContaining({ code: 'unresolved-ref', path: 'lesson/l1' }),
      );
    }
  });

  it('mdx frontmatter schema errors carry the frontmatter context', () => {
    const files = [
      ...baseFiles(),
      {
        path: 'content/broken/lessons/bad.mdx',
        data: '---\nid: bad-lesson\ntitle: Bad\nminutes: not-a-number\n---\n\nBody text.',
      },
    ];
    try {
      wrap(files);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as ContentValidationError).issues).toContainEqual(
        expect.objectContaining({
          code: 'schema',
          path: expect.stringContaining('bad.mdx (frontmatter)'),
        }),
      );
    }
  });
});

/* ------------------------------- accessors -------------------------------- */

describe('createSubjectIndex', () => {
  const content = source.loadSubject('fixture');
  const index = createSubjectIndex(content);

  it('map-backed lookups', () => {
    expect(index.getLesson('lesson-storage-models')?.title).toBe('Storage models');
    expect(index.getLessonBySlug('query-shapes')?.id).toBe('lesson-query-shapes');
    expect(index.getQuestion('q-single')?.kind).toBe('single');
    expect(index.getQuestions(['q-single', 'ghost', 'q-fill'])).toHaveLength(2);
    expect(index.getLab('lab-explore')?.minutes).toBe(20);
    expect(index.getExam('exam-practice')).toBeDefined();
    expect(index.getDomain('d1')?.code).toBe('D1');
    expect(index.getModule('m-storage')).toBeDefined();
  });

  it('domain/module scoping', () => {
    expect(index.modulesForDomain('d1').map((m) => m.id)).toEqual(['m-storage']);
    expect(index.lessonsForModule('m-storage').map((l) => l.id)).toEqual(['lesson-storage-models']);
    expect(index.lessonsForDomain('d2').map((l) => l.id)).toEqual(['lesson-query-shapes']);
    expect(index.questionsForDomain('d2')).toHaveLength(3);
  });

  it('lesson sequence and adjacent lessons', () => {
    expect(index.lessonSequence().map((l) => l.id)).toEqual([
      'lesson-storage-models',
      'lesson-query-shapes',
    ]);
    expect(index.adjacentLessons('lesson-storage-models').next?.id).toBe('lesson-query-shapes');
    expect(index.adjacentLessons('lesson-query-shapes').prev?.id).toBe('lesson-storage-models');
    expect(index.adjacentLessons('lesson-storage-models').prev).toBeUndefined();
    expect(index.adjacentLessons('ghost')).toEqual({});
  });

  it('totals', () => {
    expect(index.totals).toEqual({ lessons: 2, labs: 1, questions: 7, exams: 2 });
  });
});
