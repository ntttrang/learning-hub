import { describe, expect, it } from 'vitest';
import { assemblePaper } from '../engines/exam-paper';
import {
  ComparisonSchema,
  DocsSchema,
  DomainSchema,
  ExamSchema,
  LabSchema,
  LessonFrontmatterSchema,
  LessonSchema,
  ModuleSchema,
  QuestionSchema,
  SubjectSchema,
  validateSubject,
} from './validate';
import { fixtureSubjectContent } from './test-fixtures';
import type { SubjectContent } from './types';

/** Fresh deep copy so fault-seeding mutations never leak across tests. */
function pack(): SubjectContent {
  return JSON.parse(JSON.stringify(fixtureSubjectContent)) as SubjectContent;
}

const codes = (issues: ReturnType<typeof validateSubject>) => issues.map((i) => i.code);
const at = (issues: ReturnType<typeof validateSubject>, path: string) =>
  issues.filter((i) => i.path === path);

/* ------------------------------ shape schemas ----------------------------- */

describe('shape schemas accept the fixture pack', () => {
  it('subject', () => {
    expect(() => SubjectSchema.parse(fixtureSubjectContent.subject)).not.toThrow();
  });
  it('domains (both weight forms)', () => {
    for (const d of fixtureSubjectContent.domains) expect(() => DomainSchema.parse(d)).not.toThrow();
  });
  it('modules', () => {
    for (const m of fixtureSubjectContent.modules) expect(() => ModuleSchema.parse(m)).not.toThrow();
  });
  it('lessons (json with blocks)', () => {
    for (const l of fixtureSubjectContent.lessons) expect(() => LessonSchema.parse(l)).not.toThrow();
  });
  it('lesson frontmatter (mdx metadata without blocks)', () => {
    const { blocks: _blocks, ...frontmatter } = fixtureSubjectContent.lessons[0];
    expect(() => LessonFrontmatterSchema.parse(frontmatter)).not.toThrow();
  });
  it('labs (rich steps)', () => {
    for (const lab of fixtureSubjectContent.labs) expect(() => LabSchema.parse(lab)).not.toThrow();
  });
  it('every question kind', () => {
    for (const q of fixtureSubjectContent.questions) expect(() => QuestionSchema.parse(q)).not.toThrow();
  });
  it('exams (fixed + sampled selections)', () => {
    for (const e of fixtureSubjectContent.exams) expect(() => ExamSchema.parse(e)).not.toThrow();
  });
  it('comparison + docs registry', () => {
    expect(() => ComparisonSchema.parse(fixtureSubjectContent.comparisons[0])).not.toThrow();
    expect(() => DocsSchema.parse(fixtureSubjectContent.docs)).not.toThrow();
  });
});

describe('shape schemas reject malformed content', () => {
  it('unknown keys are typos, not silently dropped', () => {
    expect(SubjectSchema.safeParse({ ...fixtureSubjectContent.subject, enableModes: ['learn'] }).success).toBe(false);
  });
  it('accent must be a locked token', () => {
    expect(
      SubjectSchema.safeParse({ ...fixtureSubjectContent.subject, accent: 'neon-purple' }).success,
    ).toBe(false);
  });
  it('unknown question kind', () => {
    const q = { ...fixtureSubjectContent.questions[0], kind: 'essay' };
    expect(QuestionSchema.safeParse(q).success).toBe(false);
  });
  it('single needs at least two options', () => {
    const q = fixtureSubjectContent.questions.find((x) => x.kind === 'single')!;
    expect(QuestionSchema.safeParse({ ...q, options: q.options.slice(0, 1) }).success).toBe(false);
  });
  it('mdx frontmatter parses without blocks (body arrives via the loader)', () => {
    const { blocks: _blocks, ...frontmatter } = fixtureSubjectContent.lessons[0];
    expect(LessonFrontmatterSchema.safeParse(frontmatter).success).toBe(true);
  });
  it('sampled selection requires a seed', () => {
    const exam = fixtureSubjectContent.exams.find((e) => e.selection.kind === 'sampled');
    if (!exam || exam.selection.kind !== 'sampled') throw new Error('fixture');
    const { seed: _seed, ...withoutSeed } = exam.selection;
    expect(ExamSchema.safeParse({ ...exam, selection: withoutSeed }).success).toBe(false);
  });
  it('core block kinds cannot bypass their typed shape', () => {
    const lesson = LessonSchema.parse(fixtureSubjectContent.lessons[0]);
    const bad = { ...lesson, blocks: [{ kind: 'md', body: 7 }] };
    expect(LessonSchema.safeParse(bad).success).toBe(false);
  });
  it('extension blocks stay open', () => {
    const lesson = LessonSchema.parse(fixtureSubjectContent.lessons[0]);
    const open = { ...lesson, blocks: [...lesson.blocks, { kind: 'sequence', steps: ['a', 'b'] }] };
    expect(LessonSchema.safeParse(open).success).toBe(true);
  });
});

/* ------------------------------ graph contracts --------------------------- */

describe('validateSubject: clean pack', () => {
  it('reports zero issues for the fixture', () => {
    expect(validateSubject(fixtureSubjectContent)).toEqual([]);
  });
});

describe('validateSubject: reference resolution', () => {
  it('module -> unknown domain', () => {
    const c = pack();
    c.modules[0].domainId = 'nope';
    expect(codes(validateSubject(c))).toContain('unresolved-ref');
  });
  it('lesson -> unknown lab', () => {
    const c = pack();
    c.lessons[0].labId = 'ghost-lab';
    expect(at(validateSubject(c), 'lesson/lesson-1').map((i) => i.code)).toContain('unresolved-ref');
  });
  it('lesson knowledge check -> unknown question', () => {
    const c = pack();
    c.lessons[0].questionIds = ['ghost-q'];
    expect(at(validateSubject(c), 'lesson/lesson-1').map((i) => i.code)).toContain('unresolved-ref');
  });
  it('question -> unknown lesson back-link', () => {
    const c = pack();
    c.questions[0].lessonId = 'ghost-lesson';
    expect(at(validateSubject(c), 'question/q-single').map((i) => i.code)).toContain('unresolved-ref');
  });
  it('docIds must exist in the docs registry', () => {
    const c = pack();
    c.modules[0].docIds = ['missing-doc'];
    expect(at(validateSubject(c), 'module/m1').map((i) => i.code)).toContain('unresolved-ref');
  });
});

describe('validateSubject: graph consistency', () => {
  it('lesson domain must match its module domain', () => {
    const c = pack();
    c.lessons[0].domainId = 'd2';
    expect(codes(validateSubject(c))).toContain('graph-mismatch');
  });
  it('lesson/question back-links must agree both ways', () => {
    const c = pack();
    // lesson-1 lists q-fill, but q-fill belongs to lesson-2
    c.lessons[0].questionIds = [...(c.lessons[0].questionIds ?? []), 'q-fill'];
    expect(codes(validateSubject(c))).toContain('graph-mismatch');
  });
  it('case study questions must be inside the fixed exam list', () => {
    const c = pack();
    c.exams[0].selection = { kind: 'fixed', questionIds: ['q-multi'] };
    expect(codes(validateSubject(c))).toContain('graph-mismatch');
  });
});

describe('validateSubject: id uniqueness', () => {
  it('duplicate ids within a collection', () => {
    const c = pack();
    c.domains.push({ ...c.domains[0] });
    expect(codes(validateSubject(c))).toContain('duplicate-id');
  });
  it('ids must not collide across collections', () => {
    const c = pack();
    c.comparisons[0].id = 'lesson-1';
    expect(codes(validateSubject(c))).toContain('cross-collection-id');
  });
});

describe('validateSubject: exams', () => {
  it('fixed exam -> unknown question', () => {
    const c = pack();
    c.exams[0].selection = { kind: 'fixed', questionIds: ['ghost-q'] };
    expect(codes(validateSubject(c))).toContain('unresolved-ref');
  });
  it('sampled exam -> unknown domain in plan', () => {
    const c = pack();
    c.exams[1].selection = { kind: 'sampled', domainPlan: { d9: 1 }, seed: 1 };
    expect(codes(validateSubject(c))).toContain('unresolved-ref');
  });
  it('sampled exam -> domain pool smaller than planned count', () => {
    const c = pack();
    c.exams[1].selection = { kind: 'sampled', domainPlan: { d1: 99 }, seed: 1 };
    expect(codes(validateSubject(c))).toContain('exam-infeasible');
  });
  it('sampled exam -> unknown excludeExamIds entry', () => {
    const c = pack();
    const exam = c.exams.find((e) => e.selection.kind === 'sampled');
    if (!exam || exam.selection.kind !== 'sampled') throw new Error('fixture');
    exam.selection = { ...exam.selection, excludeExamIds: ['ghost-exam'] };
    expect(codes(validateSubject(c))).toContain('unresolved-ref');
  });
  it('exclusion-starved plan: caught by the injected assembler, skipped without it', () => {
    const c = pack();
    const exam = c.exams.find((e) => e.selection.kind === 'sampled');
    if (!exam || exam.selection.kind !== 'sampled') throw new Error('fixture');
    // d1 holds 4 questions and exam-fixed serves 2 of them, so d1:3 passes the
    // raw-pool check but starves post-exclusion — exactly the gap the deep
    // check closes.
    exam.selection = { ...exam.selection, domainPlan: { d1: 3, d2: 2 } };
    expect(codes(validateSubject(c))).not.toContain('exam-infeasible');
    const issues = validateSubject(c, { assemblePaper });
    expect(codes(issues)).toContain('exam-infeasible');
    expect(at(issues, 'exam/exam-sampled')[0].message).toContain('d1');
  });
  it('feasible exclusions stay clean under the deep check', () => {
    expect(validateSubject(fixtureSubjectContent, { assemblePaper })).toEqual([]);
  });
});

describe('validateSubject: per-kind answerability', () => {
  it('single: correct id must be an option', () => {
    const c = pack();
    const q = c.questions.find((x) => x.id === 'q-single') as Extract<(typeof c.questions)[number], { kind: 'single' }>;
    q.correct = 'zz';
    expect(codes(validateSubject(c))).toContain('answerable');
  });
  it('multi: fewer than two correct options', () => {
    const c = pack();
    const q = c.questions.find((x) => x.id === 'q-multi') as Extract<(typeof c.questions)[number], { kind: 'multi' }>;
    q.correct = ['a'];
    expect(codes(validateSubject(c))).toContain('answerable');
  });
  it('multi: duplicate ids in the correct set', () => {
    const c = pack();
    const q = c.questions.find((x) => x.id === 'q-multi') as Extract<(typeof c.questions)[number], { kind: 'multi' }>;
    q.correct = ['a', 'a'];
    expect(codes(validateSubject(c))).toContain('answerable');
  });
  it('multi: needs at least one distractor', () => {
    const c = pack();
    const q = c.questions.find((x) => x.id === 'q-multi') as Extract<(typeof c.questions)[number], { kind: 'multi' }>;
    q.options = q.options.filter((o) => q.correct.includes(o.id));
    expect(codes(validateSubject(c))).toContain('answerable');
  });
  it('order: correct must be an exact permutation of options', () => {
    const c = pack();
    const q = c.questions.find((x) => x.id === 'q-order') as Extract<(typeof c.questions)[number], { kind: 'order' }>;
    q.correct = ['land', 'land', 'serve'];
    expect(codes(validateSubject(c))).toContain('answerable');
  });
  it('matching: duplicate lefts are unanswerable', () => {
    const c = pack();
    const q = c.questions.find((x) => x.id === 'q-matching') as Extract<(typeof c.questions)[number], { kind: 'matching' }>;
    q.pairs[1].left = q.pairs[0].left;
    expect(codes(validateSubject(c))).toContain('answerable');
  });
  it('fill: placeholder count must match blanks', () => {
    const c = pack();
    const q = c.questions.find((x) => x.id === 'q-fill') as Extract<(typeof c.questions)[number], { kind: 'fill' }>;
    q.template = 'SELECT ___(*);';
    expect(codes(validateSubject(c))).toContain('answerable');
  });
  it('bug: index out of range', () => {
    const c = pack();
    const q = c.questions.find((x) => x.id === 'q-bug') as Extract<(typeof c.questions)[number], { kind: 'bug' }>;
    q.buggyLineIndex = 9;
    expect(codes(validateSubject(c))).toContain('answerable');
  });
  it('duplicate option ids', () => {
    const c = pack();
    const q = c.questions.find((x) => x.id === 'q-single') as Extract<(typeof c.questions)[number], { kind: 'single' }>;
    q.options[1] = { ...q.options[1], id: 'a' };
    expect(codes(validateSubject(c))).toContain('answerable');
  });
});

describe('validateSubject: modes backed by content', () => {
  it('enabledModes learn requires lessons', () => {
    const c = pack();
    c.lessons = [];
    const issues = validateSubject(c);
    expect(codes(issues)).toContain('mode-without-content');
    expect(at(issues, 'subject/fixture-subject').length).toBeGreaterThan(0);
  });
  it('notes/revision are exempt (no content collection required)', () => {
    const c = pack();
    c.subject.enabledModes = ['notes', 'revision'];
    expect(codes(validateSubject(c))).not.toContain('mode-without-content');
  });
});
