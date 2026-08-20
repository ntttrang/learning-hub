/**
 * Content validation — the platform's side of the content contract.
 *
 * Two pure layers:
 *   1. Shape: Zod schemas mirroring `types.ts` (strict — unknown keys are
 *      typos and must fail loudly, except block extensions which are open by
 *      design and resolved through the block registry).
 *   2. Graph: `validateSubject()` enforces the platform content-integrity
 *      contracts (docs/unified-learning-hub-plan.md §8) over an assembled
 *      pack: reference resolution, per-kind answerability, mode/content
 *      agreement, id uniqueness, and sampled-exam feasibility.
 *
 * Returns issues, never throws, so one run reports everything an author needs
 * to fix. CI runs this through `npm run content:check`.
 */
import { z } from 'zod';
import {
  ACCENT_TOKENS,
  TOOL_IDS,
  type Exam,
  type Question,
  type Subject,
  type SubjectContent,
} from './types';
import { CONTENT_BACKED_TOOLS } from './registry/tools';

/* ------------------------------ shape schemas ----------------------------- */

const idSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:[-.][a-z0-9]+)*$/, 'ids are kebab-case (letters, digits, -, .)');

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'ISO date (YYYY-MM-DD…)');

export const ReferenceSchema = z
  .object({
    title: z.string().min(1),
    url: z.string().min(1),
    publisher: z.string().optional(),
    accessed: isoDate.optional(),
  })
  .strict();

export const SubjectSchema = z
  .object({
    id: idSchema,
    code: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    accent: z.enum(ACCENT_TOKENS),
    disclaimers: z.array(z.string()).optional(),
    enabledModes: z.array(z.enum(TOOL_IDS)).min(1),
  })
  .strict();

const weightSchema = z.union([
  z.string().min(1), // "35-40%"
  z.object({ min: z.number(), max: z.number() }).strict(),
]);

export const DomainSchema = z
  .object({
    id: idSchema,
    order: z.number(),
    code: z.string().optional(),
    title: z.string().min(1),
    weight: weightSchema.optional(),
    summary: z.string().optional(),
  })
  .strict();

export const ModuleSchema = z
  .object({
    id: idSchema,
    domainId: idSchema,
    order: z.number(),
    code: z.string().optional(),
    title: z.string().min(1),
    summary: z.string().optional(),
    officialSkills: z.array(z.string()).optional(),
    docIds: z.array(z.string()).optional(),
  })
  .strict();

/** Core block kinds — everything else flows through ExtensionBlock. */
const CORE_BLOCK_KINDS = ['md', 'heading', 'list', 'code', 'tip', 'table'] as const;

const CoreBlockSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('md'), body: z.string() }).strict(),
  z
    .object({ kind: z.literal('heading'), text: z.string().min(1), level: z.number().int().optional() })
    .strict(),
  z
    .object({
      kind: z.literal('list'),
      items: z.array(z.string()),
      ordered: z.boolean().optional(),
    })
    .strict(),
  z
    .object({ kind: z.literal('code'), language: z.string().min(1), code: z.string() })
    .strict(),
  z.object({ kind: z.literal('tip'), text: z.string() }).strict(),
  z
    .object({
      kind: z.literal('table'),
      headers: z.array(z.string()),
      rows: z.array(z.array(z.string())),
    })
    .strict(),
]);

/** Open extension point: registered kinds carry their own payloads. */
export const BlockSchema = z.union([
  CoreBlockSchema,
  z
    .looseObject({
      kind: z.string().refine((k) => !(CORE_BLOCK_KINDS as readonly string[]).includes(k), {
        message: 'core kinds use their typed shape; pick another kind id for extensions',
      }),
    })
    .describe('extension block'),
]);

const baseLessonFields = {
  id: idSchema,
  domainId: idSchema,
  moduleId: idSchema.optional(),
  order: z.number().optional(),
  slug: z.string().optional(),
  title: z.string().min(1),
  summary: z.string().optional(),
  minutes: z.number().positive(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'challenge']).optional(),
  flagship: z.boolean().optional(),
  labId: idSchema.optional(),
  questionIds: z.array(idSchema).optional(),
  references: z.array(ReferenceSchema).optional(),
  docIds: z.array(z.string()).optional(),
} as const;

/** `.json` lessons carry explicit structured blocks. */
export const LessonSchema = z
  .object({ ...baseLessonFields, blocks: z.array(BlockSchema).min(1) })
  .strict();

/** `.mdx` lessons carry metadata in frontmatter; the loader appends the body as an `md` block after any frontmatter-declared blocks. */
export const LessonFrontmatterSchema = z
  .object({ ...baseLessonFields, blocks: z.array(BlockSchema).optional() })
  .strict();

export const LabStepSchema = z
  .object({
    title: z.string().optional(),
    instructions: z.string().min(1),
    starterSql: z.string().optional(),
    hint: z.string().optional(),
    solution: z.string().optional(),
    expectedOutput: z.string().optional(),
    validation: z.string().optional(),
  })
  .strict();

export const LabSchema = z
  .object({
    id: idSchema,
    domainId: idSchema,
    lessonId: idSchema.optional(),
    title: z.string().min(1),
    minutes: z.number().positive(),
    summary: z.string().min(1),
    steps: z.array(LabStepSchema).min(1),
    outcomes: z.array(z.string()).optional(),
    checks: z.array(z.string()).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'challenge']).optional(),
    scenario: z.string().optional(),
    objective: z.string().optional(),
    prerequisites: z.array(z.string()).optional(),
    engines: z.array(z.string()).optional(),
    schemaSql: z.string().optional(),
    seedSql: z.string().optional(),
    engineNotes: z.record(z.string(), z.string()).optional(),
    solutionExplanation: z.string().optional(),
  })
  .strict();

const optionSchema = z
  .object({ id: idSchema, text: z.string().min(1) })
  .strict();

const questionBase = {
  id: idSchema,
  domainId: idSchema,
  moduleId: idSchema.optional(),
  lessonId: idSchema.optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'challenge']).optional(),
  prompt: z.string().min(1),
  explanation: z.string().min(1),
  tags: z.array(z.string()).optional(),
  docIds: z.array(z.string()).optional(),
} as const;

export const QuestionSchema = z.discriminatedUnion('kind', [
  z
    .object({ ...questionBase, kind: z.literal('single'), options: z.array(optionSchema).min(2), correct: idSchema })
    .strict(),
  z
    .object({ ...questionBase, kind: z.literal('multi'), options: z.array(optionSchema).min(2), correct: z.array(idSchema).min(1) })
    .strict(),
  z
    .object({ ...questionBase, kind: z.literal('order'), options: z.array(optionSchema).min(2), correct: z.array(idSchema).min(2) })
    .strict(),
  z
    .object({
      ...questionBase,
      kind: z.literal('matching'),
      pairs: z.array(z.object({ left: z.string().min(1), right: z.string().min(1) }).strict()).min(2),
    })
    .strict(),
  z
    .object({
      ...questionBase,
      kind: z.literal('fill'),
      template: z.string().min(1),
      blanks: z.array(
        z.object({ answer: z.string().min(1), alternatives: z.array(z.string()).optional() }).strict(),
      ),
    })
    .strict(),
  z
    .object({ ...questionBase, kind: z.literal('codeReading'), code: z.string().min(1), options: z.array(optionSchema).min(2), correct: idSchema })
    .strict(),
  z
    .object({
      ...questionBase,
      kind: z.literal('bug'),
      codeLines: z.array(z.string()).min(2),
      buggyLineIndex: z.number().int(),
    })
    .strict(),
]);

export const CaseStudySchema = z
  .object({
    id: idSchema,
    title: z.string().min(1),
    background: z.string().min(1),
    questionIds: z.array(idSchema).min(1),
  })
  .strict();

const examSelectionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('fixed'), questionIds: z.array(idSchema).min(1) }).strict(),
  z
    .object({
      kind: z.literal('sampled'),
      domainPlan: z.record(z.string(), z.number().int().nonnegative()),
      seed: z.number().int(),
      excludeExamIds: z.array(idSchema).optional(),
    })
    .strict(),
]);

export const ExamSchema = z
  .object({
    id: idSchema,
    title: z.string().min(1),
    description: z.string().optional(),
    durationMinutes: z.number().positive(),
    passingScore: z.number().optional(),
    selection: examSelectionSchema,
    caseStudies: z.array(CaseStudySchema).optional(),
  })
  .strict();

export const ComparisonSchema = z
  .object({
    id: idSchema,
    title: z.string().min(1),
    description: z.string().optional(),
    columns: z.array(z.object({ id: idSchema, label: z.string().min(1) }).strict()).min(2),
    rows: z
      .array(
        z
          .object({ aspect: z.string().min(1), cells: z.record(z.string(), z.string()) })
          .strict(),
      )
      .min(1),
    samples: z
      .array(
        z
          .object({ label: z.string().min(1), code: z.record(z.string(), z.string()) })
          .strict(),
      )
      .optional(),
    migration: z
      .object({
        equivalent: z.string(),
        different: z.string(),
        directMigration: z.string(),
        syntaxChanges: z.string(),
        limitations: z.string(),
        whenToUse: z.string(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const DocsSchema = z.record(z.string(), ReferenceSchema);

/* --------------------------- graph / integrity ---------------------------- */

export interface ValidationIssue {
  code: string;
  path: string;
  message: string;
}

/**
 * Hooks the app layer can inject so graph validation runs the same
 * deterministic paper assembly the exam engine uses. Without it the SDK stays
 * standalone: sampled-exam feasibility is checked against raw domain pools
 * only, and cross-exam exclusion overlap is not deep-checked.
 */
export interface ValidateOptions {
  assemblePaper?: (content: SubjectContent, exam: Exam) => Question[];
}

// Mode/content agreement uses CONTENT_BACKED_TOOLS from sdk/registry/tools.ts
// (the tool registry is the authority). notes + revision ride on user data,
// not pack content — always available.

/**
 * Enforce the platform content-integrity contracts over an assembled pack.
 * Pure: no throws, no I/O — collect everything so authors fix in one pass.
 */
export function validateSubject(
  content: SubjectContent,
  options?: ValidateOptions,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (code: string, path: string, message: string) =>
    issues.push({ code, path, message });

  /* ---- id indexes + uniqueness ---- */
  const collections = [
    ['domain', content.domains],
    ['module', content.modules],
    ['lesson', content.lessons],
    ['question', content.questions],
    ['lab', content.labs],
    ['exam', content.exams],
    ['comparison', content.comparisons],
  ] as const;

  const ids = new Map<string, Set<string>>();
  const seenCross = new Map<string, string>(); // id -> owning collection
  for (const [name, items] of collections) {
    const set = new Set<string>();
    ids.set(name, set);
    for (const item of items) {
      if (set.has(item.id)) add('duplicate-id', `${name}/${item.id}`, `duplicate ${name} id`);
      set.add(item.id);
      const owner = seenCross.get(item.id);
      if (owner && owner !== name) {
        add('cross-collection-id', `${name}/${item.id}`, `id also used by ${owner}`);
      } else if (!owner) {
        seenCross.set(item.id, name);
      }
    }
  }

  const has = (name: string, id: string) => ids.get(name)?.has(id) ?? false;
  const domainIds = ids.get('domain')!;

  /* ---- curriculum graph ---- */
  for (const m of content.modules) {
    if (!has('domain', m.domainId))
      add('unresolved-ref', `module/${m.id}`, `unknown domain "${m.domainId}"`);
  }
  const moduleById = new Map(content.modules.map((m) => [m.id, m]));
  for (const lesson of content.lessons) {
    if (!has('domain', lesson.domainId))
      add('unresolved-ref', `lesson/${lesson.id}`, `unknown domain "${lesson.domainId}"`);
    if (lesson.moduleId) {
      const module = moduleById.get(lesson.moduleId);
      if (!module) {
        add('unresolved-ref', `lesson/${lesson.id}`, `unknown module "${lesson.moduleId}"`);
      } else if (module.domainId !== lesson.domainId) {
        add(
          'graph-mismatch',
          `lesson/${lesson.id}`,
          `lesson domain "${lesson.domainId}" differs from module's "${module.domainId}"`,
        );
      }
    }
    if (lesson.labId && !has('lab', lesson.labId))
      add('unresolved-ref', `lesson/${lesson.id}`, `unknown lab "${lesson.labId}"`);
    for (const qid of lesson.questionIds ?? []) {
      if (!has('question', qid))
        add('unresolved-ref', `lesson/${lesson.id}`, `unknown question "${qid}" in knowledge check`);
      const q = content.questions.find((x) => x.id === qid);
      if (q?.lessonId && q.lessonId !== lesson.id) {
        add(
          'graph-mismatch',
          `lesson/${lesson.id}`,
          `question "${qid}" links back to lesson "${q.lessonId}"`,
        );
      }
    }
  }

  for (const lab of content.labs) {
    if (!has('domain', lab.domainId))
      add('unresolved-ref', `lab/${lab.id}`, `unknown domain "${lab.domainId}"`);
    if (lab.lessonId && !has('lesson', lab.lessonId))
      add('unresolved-ref', `lab/${lab.id}`, `unknown lesson "${lab.lessonId}"`);
  }

  for (const q of content.questions) {
    if (!has('domain', q.domainId))
      add('unresolved-ref', `question/${q.id}`, `unknown domain "${q.domainId}"`);
    if (q.moduleId && !has('module', q.moduleId))
      add('unresolved-ref', `question/${q.id}`, `unknown module "${q.moduleId}"`);
    if (q.lessonId && !has('lesson', q.lessonId))
      add('unresolved-ref', `question/${q.id}`, `unknown lesson "${q.lessonId}"`);
  }

  /* ---- citation registry ---- */
  const docIds = new Set(Object.keys(content.docs));
  const checkDocs = (where: string, refs: string[] | undefined) => {
    for (const docId of refs ?? []) {
      if (!docIds.has(docId))
        add('unresolved-ref', where, `unknown docId "${docId}" (missing from docs.json)`);
    }
  };
  for (const m of content.modules) checkDocs(`module/${m.id}`, m.docIds);
  for (const lesson of content.lessons) checkDocs(`lesson/${lesson.id}`, lesson.docIds);
  for (const q of content.questions) checkDocs(`question/${q.id}`, q.docIds);

  /* ---- exams ---- */
  for (const exam of content.exams) {
    if (exam.selection.kind === 'fixed') {
      for (const qid of exam.selection.questionIds) {
        if (!has('question', qid))
          add('unresolved-ref', `exam/${exam.id}`, `unknown question "${qid}"`);
      }
      const fixed = new Set(exam.selection.questionIds);
      for (const cs of exam.caseStudies ?? []) {
        for (const qid of cs.questionIds) {
          if (!fixed.has(qid)) {
            add(
              'graph-mismatch',
              `exam/${exam.id}`,
              `case study "${cs.id}" references "${qid}" outside the exam's question list`,
            );
          }
        }
      }
    } else {
      for (const [domainId, count] of Object.entries(exam.selection.domainPlan)) {
        if (!domainIds.has(domainId)) {
          add('unresolved-ref', `exam/${exam.id}`, `unknown domain "${domainId}" in domainPlan`);
          continue;
        }
        const pool = content.questions.filter((q) => q.domainId === domainId).length;
        if (pool < count) {
          add(
            'exam-infeasible',
            `exam/${exam.id}`,
            `domain "${domainId}" plans ${count} questions but only ${pool} exist`,
          );
        }
      }
      for (const excluded of exam.selection.excludeExamIds ?? []) {
        if (!has('exam', excluded))
          add('unresolved-ref', `exam/${exam.id}`, `unknown exam "${excluded}" in excludeExamIds`);
      }
      // Deep feasibility: when the app injects the real paper assembly, a plan
      // that only starves after cross-exam exclusion fails here — at the gate —
      // instead of throwing inside a render at sitting time.
      if (options?.assemblePaper && (exam.selection.excludeExamIds?.length ?? 0) > 0) {
        try {
          options.assemblePaper(content, exam);
        } catch (error) {
          add(
            'exam-infeasible',
            `exam/${exam.id}`,
            `excludeExamIds starves the plan: ${(error as Error).message}`,
          );
        }
      }
    }
  }

  /* ---- per-kind answerability ---- */
  for (const q of content.questions) {
    const optionIds = 'options' in q ? q.options.map((o) => o.id) : [];
    const duplicateOption = optionIds.some((id, i) => optionIds.indexOf(id) !== i);
    if (duplicateOption) add('answerable', `question/${q.id}`, 'duplicate option ids');

    switch (q.kind) {
      case 'single':
      case 'codeReading':
        if (!optionIds.includes(q.correct))
          add('answerable', `question/${q.id}`, `correct "${q.correct}" is not an option id`);
        break;
      case 'multi': {
        const correctSet = new Set(q.correct);
        if (correctSet.size !== q.correct.length)
          add('answerable', `question/${q.id}`, 'duplicate ids in multi correct');
        if (q.correct.length < 2)
          add('answerable', `question/${q.id}`, 'multi needs ≥2 correct options');
        for (const c of q.correct) {
          if (!optionIds.includes(c))
            add('answerable', `question/${q.id}`, `correct "${c}" is not an option id`);
        }
        if (optionIds.length <= correctSet.size)
          add('answerable', `question/${q.id}`, 'multi needs ≥1 distractor');
        break;
      }
      case 'order': {
        const unique = new Set(q.correct);
        if (unique.size !== q.correct.length || unique.size !== optionIds.length) {
          add(
            'answerable',
            `question/${q.id}`,
            'order correct must be an exact permutation of all option ids',
          );
        }
        for (const c of q.correct) {
          if (!optionIds.includes(c))
            add('answerable', `question/${q.id}`, `correct "${c}" is not an option id`);
        }
        break;
      }
      case 'matching': {
        const lefts = q.pairs.map((p) => p.left);
        if (new Set(lefts).size !== lefts.length)
          add('answerable', `question/${q.id}`, 'matching lefts must be unique');
        break;
      }
      case 'fill': {
        const placeholders = q.template.split('___').length - 1;
        if (placeholders !== q.blanks.length) {
          add(
            'answerable',
            `question/${q.id}`,
            `template has ${placeholders} blanks but ${q.blanks.length} answers given`,
          );
        }
        if (q.blanks.length === 0)
          add('answerable', `question/${q.id}`, 'fill needs at least one blank');
        break;
      }
      case 'bug':
        if (q.buggyLineIndex < 0 || q.buggyLineIndex >= q.codeLines.length) {
          add(
            'answerable',
            `question/${q.id}`,
            `buggyLineIndex ${q.buggyLineIndex} outside codeLines (0..${q.codeLines.length - 1})`,
          );
        }
        break;
    }
  }

  /* ---- modes backed by content ---- */
  for (const mode of content.subject.enabledModes) {
    const collection = CONTENT_BACKED_TOOLS[mode];
    if (collection && content[collection].length === 0) {
      add(
        'mode-without-content',
        `subject/${content.subject.id}`,
        `enabledModes includes "${mode}" but the pack has no ${collection}`,
      );
    }
  }

  return issues;
}

/* ----------------------- schema ↔ type agreement -------------------------- */
/*
 * Compile-time assertions that the Zod schemas and `types.ts` stay in lockstep.
 * If one drifts, these lines fail the build, not the runtime.
 */
import type {
  Block,
  Comparison,
  DocRegistry,
  Domain,
  Lab,
  Lesson,
  QuestionOption,
} from './types';

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;
/** Identity is impossible for `Question` (an intersection in types.ts), so it
 *  asserts mutual assignability instead — still catches missing, extra, and
 *  optionality drift on every variant. */
type BothWays<A, B> = [A extends B ? true : false, B extends A ? true : false][number];

type _SubjectAgrees = Expect<Equals<z.infer<typeof SubjectSchema>, Subject>>;
type _DomainAgrees = Expect<Equals<z.infer<typeof DomainSchema>, Domain>>;
type _LessonAgrees = Expect<Equals<z.infer<typeof LessonSchema>, Lesson>>;
type _LabAgrees = Expect<Equals<z.infer<typeof LabSchema>, Lab>>;
type _ExamAgrees = Expect<Equals<z.infer<typeof ExamSchema>, Exam>>;
type _ComparisonAgrees = Expect<Equals<z.infer<typeof ComparisonSchema>, Comparison>>;
type _DocsAgrees = Expect<Equals<z.infer<typeof DocsSchema>, DocRegistry>>;
type _BlockAgrees = Expect<Equals<z.infer<typeof BlockSchema>, Block>>;
type _OptionsAgree = Expect<Equals<z.infer<typeof optionSchema>, QuestionOption>>;
type _QuestionAgrees = Expect<BothWays<z.infer<typeof QuestionSchema>, Question>>;

/** Aggregated so every assertion above is referenced (noUnusedLocals). */
export type SchemaTypeAgreement = [
  _SubjectAgrees,
  _DomainAgrees,
  _LessonAgrees,
  _LabAgrees,
  _ExamAgrees,
  _ComparisonAgrees,
  _DocsAgrees,
  _BlockAgrees,
  _OptionsAgree,
  _QuestionAgrees,
];
