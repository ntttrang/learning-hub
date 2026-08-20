/**
 * The loading half of the content SDK.
 *
 * `ContentSource` is the only seam the UI and engines talk to; packs are pure
 * data behind it. `FileContentSource` implements it over `import.meta.glob`
 * (JSON eager, MDX raw + frontmatter split) so file storage can later swap for
 * Supabase/CMS with zero UI changes.
 *
 * Pipeline per subject: gather raw files → classify paths → Zod shape-parse →
 * assemble `SubjectContent` → `validateSubject` graph-check → return, or throw
 * `ContentValidationError` carrying every issue.
 */
import matter from 'gray-matter';
import { z } from 'zod';
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
  type ValidationIssue,
  type ValidateOptions,
} from './validate';
import type {
  Domain,
  Exam,
  Lab,
  Lesson,
  Comparison,
  Module,
  Question,
  Subject,
  SubjectContent,
} from './types';

/* --------------------------------- errors --------------------------------- */

/** Every schema and contract failure from loading one pack, in one throw. */
export class ContentValidationError extends Error {
  override readonly name = 'ContentValidationError';
  readonly subjectId: string;
  readonly issues: ValidationIssue[];
  constructor(subjectId: string, issues: ValidationIssue[]) {
    super(
      `content pack "${subjectId}" is invalid:\n` +
        issues.map((i) => `  [${i.code}] ${i.path}: ${i.message}`).join('\n'),
    );
    this.subjectId = subjectId;
    this.issues = issues;
  }
}

/* ------------------------------- the interface ----------------------------- */

export interface ContentSource {
  /** Metadata for every installed pack (for subject pickers). */
  listSubjects(): Subject[];
  /** Load, shape-parse, and fully validate one pack. Throws on invalid content. */
  loadSubject(id: string): SubjectContent;
}

/* ------------------------------ path classify ------------------------------ */

export type ContentCollection =
  | 'subject'
  | 'domains'
  | 'modules'
  | 'docs'
  | 'lessons'
  | 'questions'
  | 'labs'
  | 'exams'
  | 'comparisons';

/** Files that live directly under `content/<subject>/` (not in a subfolder). */
const ROOT_COLLECTIONS = new Set<string>([
  'subject',
  'domains',
  'modules',
  'docs',
  'labs',
  'exams',
  'comparisons',
]);
/** Collections whose files live in a same-named subfolder (per-item files). */
const FOLDER_COLLECTIONS = new Set<string>(['lessons', 'questions']);

export interface ClassifiedPath {
  subjectId: string;
  collection: ContentCollection;
  /** Stem of the file name — distinguishes items within a collection. */
  entryKey: string;
}

/**
 * Derive {subjectId, collection, entryKey} from a path like
 * `content/fixture/questions/q-single.json` or `content/fixture/subject.json`.
 * Pure and table-driven so the convention is testable in isolation.
 */
export function parseContentPath(path: string): ClassifiedPath {
  const normalized = path.replace(/^\//, '');
  const withoutContent = normalized.startsWith('content/') ? normalized.slice('content/'.length) : normalized;
  const segments = withoutContent.split('/');
  if (segments.length < 2) {
    throw new Error(`content path must be content/<subject>/… : ${path}`);
  }
  const [subjectId, second, ...rest] = segments;

  if (rest.length === 0) {
    // content/<subject>/<collection>.json
    const collection = second.replace(/\.json$/, '');
    if (!ROOT_COLLECTIONS.has(collection)) {
      throw new Error(
        `unknown content file "content/${subjectId}/${second}" — expected one of: ${[...ROOT_COLLECTIONS].join(', ')}`,
      );
    }
    return { subjectId, collection: collection as ContentCollection, entryKey: collection };
  }

  // content/<subject>/<collection>/<name>.{json,mdx}
  const collection = second;
  if (!FOLDER_COLLECTIONS.has(collection)) {
    throw new Error(
      `unknown content folder "content/${subjectId}/${collection}" — expected one of: ${[...FOLDER_COLLECTIONS].join(', ')}`,
    );
  }
  const fileName = rest[rest.length - 1];
  const ext = /\.(json|mdx)$/.exec(fileName);
  if (!ext || rest.length !== 1) {
    throw new Error(`content file must be directly inside its collection folder: ${path}`);
  }
  return {
    subjectId,
    collection: collection as ContentCollection,
    entryKey: fileName.slice(0, -ext[0].length),
  };
}

/* ------------------------------ raw file input ----------------------------- */

/** One file from the glob layer, before any parsing. */
export interface RawContentFile {
  /** Path starting at `content/…` (glob keys are root-anchored). */
  path: string;
  /** `.json` files arrive eager-parsed; `.mdx` files arrive as raw strings. */
  data: unknown;
}

/* ------------------------------ assembly core ------------------------------ */

/** Root-level array files: one JSON array per collection. */
const ARRAY_FILE_SCHEMAS = {
  domains: z.array(DomainSchema),
  modules: z.array(ModuleSchema),
  labs: z.array(LabSchema),
  exams: z.array(ExamSchema),
  comparisons: z.array(ComparisonSchema),
} as const;

/** Per-item files: one object per file inside the collection folder. */
const ITEM_FILE_SCHEMAS = {
  subject: SubjectSchema,
  lessons: LessonSchema,
  questions: QuestionSchema,
  docs: DocsSchema,
} as const;

function schemaFor(collection: ContentCollection): z.ZodType | undefined {
  if (collection in ARRAY_FILE_SCHEMAS) return ARRAY_FILE_SCHEMAS[collection as keyof typeof ARRAY_FILE_SCHEMAS];
  if (collection in ITEM_FILE_SCHEMAS) return ITEM_FILE_SCHEMAS[collection as keyof typeof ITEM_FILE_SCHEMAS];
  return undefined;
}

interface SubjectAccumulator {
  subject?: Subject;
  domains: Domain[];
  modules: Module[];
  lessons: Lesson[];
  questions: Question[];
  labs: Lab[];
  exams: Exam[];
  comparisons: Comparison[];
  docs: SubjectContent['docs'];
}

/**
 * Parse and assemble one subject's files into a validated `SubjectContent`.
 * Separated from the glob layer so tests can feed broken inputs directly.
 * Collects every issue, then throws `ContentValidationError` once.
 */
export function assembleSubject(
  subjectId: string,
  files: RawContentFile[],
  options?: ValidateOptions,
): SubjectContent {
  const issues: ValidationIssue[] = [];
  const acc: SubjectAccumulator = {
    domains: [],
    modules: [],
    lessons: [],
    questions: [],
    labs: [],
    exams: [],
    comparisons: [],
    docs: {},
  };

  const shapeError = (path: string, error: unknown) => {
    const zodIssues =
      typeof error === 'object' && error !== null && 'issues' in error
        ? ((error as { issues: { path: PropertyKey[]; message: string }[] }).issues ?? [])
        : [];
    if (zodIssues.length > 0) {
      for (const zi of zodIssues) {
        issues.push({
          code: 'schema',
          path: `${path}#${zi.path.map(String).join('.')}`,
          message: zi.message,
        });
      }
    } else {
      issues.push({ code: 'schema', path, message: String(error) });
    }
  };

  for (const file of files) {
    let classified: ClassifiedPath;
    try {
      classified = parseContentPath(file.path);
    } catch (error) {
      issues.push({ code: 'path', path: file.path, message: (error as Error).message });
      continue;
    }
    if (classified.subjectId !== subjectId) continue;
    const { collection, entryKey } = classified;

    if (collection === 'lessons' && file.path.endsWith('.mdx')) {
      const parsed = matter(file.data as string);
      const front = LessonFrontmatterSchema.safeParse(parsed.data);
      if (!front.success) {
        shapeError(`${file.path} (frontmatter)`, front.error);
        continue;
      }
      const { blocks, ...fields } = front.data;
      const body = parsed.content.trim();
      acc.lessons.push({
        ...fields,
        blocks: [...(blocks ?? []), { kind: 'md', body }],
      } as Lesson);
      continue;
    }

    const schema = schemaFor(collection);
    if (!schema) {
      issues.push({ code: 'path', path: file.path, message: `no schema handles collection "${collection}"` });
      continue;
    }
    const result = schema.safeParse(file.data);
    if (!result.success) {
      shapeError(`${file.path} (${collection} ${entryKey})`, result.error);
      continue;
    }

    switch (collection) {
      case 'subject':
        acc.subject = result.data as Subject;
        break;
      case 'domains':
        acc.domains.push(...(result.data as Domain[]));
        break;
      case 'modules':
        acc.modules.push(...(result.data as Module[]));
        break;
      case 'questions':
        acc.questions.push(result.data as Question);
        break;
      case 'lessons':
        acc.lessons.push(result.data as Lesson);
        break;
      case 'labs':
        acc.labs.push(...(result.data as Lab[]));
        break;
      case 'exams':
        acc.exams.push(...(result.data as Exam[]));
        break;
      case 'comparisons':
        acc.comparisons.push(...(result.data as Comparison[]));
        break;
      case 'docs':
        acc.docs = result.data as SubjectContent['docs'];
        break;
    }
  }

  if (!acc.subject) {
    issues.push({
      code: 'missing-file',
      path: `content/${subjectId}/subject.json`,
      message: 'pack root metadata file is missing',
    });
  } else if (acc.subject.id !== subjectId) {
    issues.push({
      code: 'schema',
      path: `content/${subjectId}/subject.json`,
      message: `subject id "${acc.subject.id}" does not match its directory "${subjectId}"`,
    });
  }

  const content: SubjectContent = {
    subject:
      acc.subject ?? {
        id: subjectId,
        code: subjectId,
        title: subjectId,
        accent: 'captain-red',
        enabledModes: ['learn'],
      },
    docs: acc.docs,
    domains: acc.domains,
    modules: acc.modules,
    lessons: acc.lessons,
    questions: acc.questions,
    labs: acc.labs,
    exams: acc.exams,
    comparisons: acc.comparisons,
  };

  issues.push(...validateSubject(content, options));
  if (issues.length > 0) throw new ContentValidationError(subjectId, issues);
  return content;
}

/* ---------------------------- loaded-subject index ---------------------------- */

/**
 * The dp-800 `content.ts` accessor family, generalized to operate on any
 * loaded `SubjectContent` instead of one app's static curriculum. Build once
 * per subject after `loadSubject`; all lookups are map-backed.
 */
export interface SubjectIndex {
  getLesson(id: string): Lesson | undefined;
  getLessonBySlug(slug: string): Lesson | undefined;
  getModule(id: string): Module | undefined;
  getDomain(id: string): Domain | undefined;
  getQuestion(id: string): Question | undefined;
  getQuestions(ids: string[]): Question[];
  getLab(id: string): Lab | undefined;
  getExam(id: string): Exam | undefined;
  modulesForDomain(domainId: string): Module[];
  lessonsForModule(moduleId: string): Lesson[];
  lessonsForDomain(domainId: string): Lesson[];
  questionsForModule(moduleId: string): Question[];
  questionsForDomain(domainId: string): Question[];
  /** Ordered flat lesson list (domain → module → lesson) for prev/next nav. */
  lessonSequence(): Lesson[];
  adjacentLessons(id: string): { prev?: Lesson; next?: Lesson };
  totals: { lessons: number; labs: number; questions: number; exams: number };
}

export function createSubjectIndex(content: SubjectContent): SubjectIndex {
  const lessonById = new Map(content.lessons.map((l) => [l.id, l]));
  const lessonBySlug = new Map(content.lessons.map((l) => [l.slug ?? l.id, l]));
  const moduleById = new Map(content.modules.map((m) => [m.id, m]));
  const domainById = new Map(content.domains.map((d) => [d.id, d]));
  const questionById = new Map(content.questions.map((q) => [q.id, q]));
  const labById = new Map(content.labs.map((l) => [l.id, l]));
  const examById = new Map(content.exams.map((e) => [e.id, e]));

  const byOrder = <T extends { order?: number }>(xs: T[]) =>
    [...xs].sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));

  const sequence = () =>
    content.domains
      .slice()
      .sort((a, b) => a.order - b.order)
      .flatMap((d) => byOrder(content.modules.filter((m) => m.domainId === d.id)).flatMap((m) => byOrder(content.lessons.filter((l) => l.moduleId === m.id))));

  return {
    getLesson: (id) => lessonById.get(id),
    getLessonBySlug: (slug) => lessonBySlug.get(slug),
    getModule: (id) => moduleById.get(id),
    getDomain: (id) => domainById.get(id),
    getQuestion: (id) => questionById.get(id),
    getQuestions: (ids) => ids.map((id) => questionById.get(id)).filter((q): q is Question => !!q),
    getLab: (id) => labById.get(id),
    getExam: (id) => examById.get(id),
    modulesForDomain: (domainId) => byOrder(content.modules.filter((m) => m.domainId === domainId)),
    lessonsForModule: (moduleId) => byOrder(content.lessons.filter((l) => l.moduleId === moduleId)),
    lessonsForDomain: (domainId) => content.lessons.filter((l) => l.domainId === domainId),
    questionsForModule: (moduleId) => content.questions.filter((q) => q.moduleId === moduleId),
    questionsForDomain: (domainId) => content.questions.filter((q) => q.domainId === domainId),
    lessonSequence: sequence,
    adjacentLessons(id) {
      const seq = sequence();
      const idx = seq.findIndex((l) => l.id === id);
      if (idx === -1) return {};
      return {
        prev: idx > 0 ? seq[idx - 1] : undefined,
        next: idx < seq.length - 1 ? seq[idx + 1] : undefined,
      };
    },
    totals: {
      lessons: content.lessons.length,
      labs: content.labs.length,
      questions: content.questions.length,
      exams: content.exams.length,
    },
  };
}

/* ---------------------------- FileContentSource ---------------------------- */

/**
 * `ContentSource` over files under `content/<subject>/**`, loaded through
 * Vite's glob importer (verified in Phase 1):
 *   - `.json` eager-parsed objects
 *   - `.mdx` raw strings via `{ query: '?raw', import: 'default', eager: true }`
 *
 * The glob patterns must be string literals (Vite statically analyzes them),
 * so the content root is fixed here by design; other sources implement the
 * same interface with their own roots.
 */
export function createFileContentSource(options?: ValidateOptions): ContentSource {
  // `import: 'default'` matters for JSON: without it Vite hands back the ES
  // module namespace, and its JSON plugin adds named exports for every
  // identifier-safe top-level key, so the wrapper shape varies per file.
  const jsonFiles = import.meta.glob('/content/**/*.json', {
    eager: true,
    import: 'default',
  }) as Record<string, unknown>;
  const mdxFiles = import.meta.glob('/content/**/*.mdx', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  const all: RawContentFile[] = [
    ...Object.entries(jsonFiles).map(([path, data]) => ({ path, data })),
    ...Object.entries(mdxFiles).map(([path, data]) => ({ path, data })),
  ];

  const bySubject = new Map<string, RawContentFile[]>();
  for (const file of all) {
    let subjectId: string;
    try {
      subjectId = parseContentPath(file.path).subjectId;
    } catch {
      continue; // unclassifiable paths are reported by assembleSubject for the requested subject
    }
    const bucket = bySubject.get(subjectId) ?? [];
    bucket.push(file);
    bySubject.set(subjectId, bucket);
  }

  const load = (id: string): SubjectContent => {
    const files = bySubject.get(id);
    if (!files) {
      throw new ContentValidationError(id, [
        { code: 'missing-pack', path: `content/${id}`, message: 'no content directory for this subject' },
      ]);
    }
    return assembleSubject(id, files, options);
  };

  return {
    listSubjects: () => [...bySubject.keys()].sort().map((id) => load(id).subject),
    loadSubject: load,
  };
}
