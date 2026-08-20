/**
 * A complete, contract-clean subject pack used by validation tests and
 * `npm run content:check`. Fault-seeding tests derive broken variants from
 * this object so the "valid" baseline is asserted in exactly one place.
 *
 * Phase 4 mirrors this shape as the on-disk `content/fixture/` pack; keep the
 * two in sync when the schema evolves (the content-check test enforces it).
 */
import type { SubjectContent } from './types';

export const fixtureSubjectContent: SubjectContent = {
  subject: {
    id: 'fixture-subject',
    code: 'FX-100',
    title: 'Fixture Subject',
    subtitle: 'Validation test pack',
    description: 'Exercises every core question kind and contract.',
    accent: 'hub-green',
    enabledModes: ['learn', 'labs', 'practice', 'exams', 'compare', 'notes', 'revision'],
  },
  docs: {
    'ms-doc': { title: 'Official docs', url: 'https://example.com/docs', publisher: 'Example', accessed: '2026-01-15' },
  },
  domains: [
    { id: 'd1', order: 1, code: 'D1', title: 'Core concepts', weight: '35-40%', summary: 'Fundamentals.' },
    { id: 'd2', order: 2, code: 'D2', title: 'Applied skills', weight: { min: 20, max: 25 } },
  ],
  modules: [
    {
      id: 'm1',
      domainId: 'd1',
      order: 1,
      code: '01',
      title: 'Storage models',
      summary: 'Files vs tables.',
      officialSkills: ['Choose a storage model'],
      docIds: ['ms-doc'],
    },
    {
      id: 'm2',
      domainId: 'd2',
      order: 2,
      title: 'Querying',
      summary: 'Get data back out.',
    },
  ],
  lessons: [
    {
      id: 'lesson-1',
      domainId: 'd1',
      moduleId: 'm1',
      order: 1,
      slug: 'storage-models',
      title: 'Storage models',
      summary: 'When to use files, tables, or both.',
      minutes: 12,
      difficulty: 'beginner',
      flagship: true,
      blocks: [
        { kind: 'heading', text: 'Overview', level: 2 },
        { kind: 'md', body: 'Lakehouse storage builds on two primitives.' },
        { kind: 'list', items: ['Files in the lake', 'Tables over files'], ordered: true },
        { kind: 'code', language: 'sql', code: 'SELECT 1;' },
        { kind: 'tip', text: 'Tables are metadata over files.' },
        { kind: 'table', headers: ['Model', 'Best for'], rows: [['Files', 'Raw ingestion']] },
        { kind: 'callout', tone: 'info', body: 'Extension blocks flow through the registry.' },
      ],
      labId: 'lab-1',
      questionIds: ['q-single', 'q-multi', 'q-order'],
      references: [{ title: 'Docs', url: 'https://example.com/docs' }],
      docIds: ['ms-doc'],
    },
    {
      id: 'lesson-2',
      domainId: 'd2',
      moduleId: 'm2',
      order: 2,
      title: 'Query shapes',
      minutes: 8,
      blocks: [{ kind: 'md', body: 'Every query is a SELECT at heart.' }],
      questionIds: ['q-fill'],
    },
  ],
  questions: [
    {
      id: 'q-single',
      kind: 'single',
      domainId: 'd1',
      moduleId: 'm1',
      lessonId: 'lesson-1',
      difficulty: 'beginner',
      prompt: 'Which format stores data as files?',
      explanation: 'A lakehouse stores data as files in a lake.',
      options: [
        { id: 'a', text: 'Parquet in the lake' },
        { id: 'b', text: 'Rowstore heaps' },
      ],
      correct: 'a',
      tags: ['storage'],
      docIds: ['ms-doc'],
    },
    {
      id: 'q-multi',
      kind: 'multi',
      domainId: 'd1',
      moduleId: 'm1',
      lessonId: 'lesson-1',
      prompt: 'Which are file formats? (choose two)',
      explanation: 'Parquet and Delta are file formats.',
      options: [
        { id: 'a', text: 'Parquet' },
        { id: 'b', text: 'Delta' },
        { id: 'c', text: 'Rowstore' },
      ],
      correct: ['a', 'b'],
    },
    {
      id: 'q-order',
      kind: 'order',
      domainId: 'd1',
      moduleId: 'm1',
      lessonId: 'lesson-1',
      prompt: 'Order the ingestion pipeline stages.',
      explanation: 'Land, cleanse, then serve.',
      options: [
        { id: 'land', text: 'Landing zone' },
        { id: 'cleanse', text: 'Cleansed zone' },
        { id: 'serve', text: 'Serving layer' },
      ],
      correct: ['land', 'cleanse', 'serve'],
    },
    {
      id: 'q-matching',
      kind: 'matching',
      domainId: 'd1',
      prompt: 'Match each term to its definition.',
      explanation: 'Definitions.',
      pairs: [
        { left: 'Lakehouse', right: 'Files + table semantics' },
        { left: 'Warehouse', right: 'Native table storage' },
      ],
    },
    {
      id: 'q-fill',
      kind: 'fill',
      domainId: 'd2',
      moduleId: 'm2',
      lessonId: 'lesson-2',
      prompt: 'Complete the query.',
      explanation: 'COUNT counts rows.',
      template: 'SELECT ___(*) FROM ___;',
      blanks: [
        { answer: 'COUNT', alternatives: ['count'] },
        { answer: 'orders' },
      ],
    },
    {
      id: 'q-code-reading',
      kind: 'codeReading',
      domainId: 'd2',
      prompt: 'What does this return?',
      explanation: 'DISTINCT removes duplicates.',
      code: 'SELECT DISTINCT city FROM customers;',
      options: [
        { id: 'a', text: 'Unique cities' },
        { id: 'b', text: 'All rows' },
      ],
      correct: 'a',
    },
    {
      id: 'q-bug',
      kind: 'bug',
      domainId: 'd2',
      prompt: 'Which line fails?',
      explanation: 'ORDER BY needs a column list, not aliases defined later.',
      codeLines: ['SELECT name AS n', 'FROM users', 'ORDER BY nickname'],
      buggyLineIndex: 2,
    },
  ],
  labs: [
    {
      id: 'lab-1',
      domainId: 'd1',
      lessonId: 'lesson-1',
      title: 'Explore the lake',
      minutes: 20,
      summary: 'Query files through a table.',
      steps: [
        {
          title: 'Count rows',
          instructions: 'Count the rows in the trips table.',
          starterSql: 'SELECT ___ FROM trips;',
          hint: 'COUNT(*)',
          solution: 'SELECT COUNT(*) FROM trips;',
          expectedOutput: '| count |\n|---|',
          validation: 'One row, one column.',
        },
      ],
      outcomes: ['Know how to count rows'],
      checks: ['COUNT returns exactly 1 row'],
      difficulty: 'beginner',
      scenario: 'A data lake with one table.',
      objective: 'Practice counting.',
      prerequisites: ['lesson-1'],
      engines: ['postgresql'],
      schemaSql: 'CREATE TABLE trips (...);',
      seedSql: 'INSERT INTO trips VALUES (...);',
      engineNotes: { postgresql: 'Works on any recent version.' },
      solutionExplanation: 'COUNT(*) counts all rows.',
    },
  ],
  exams: [
    {
      id: 'exam-fixed',
      title: 'Practice exam',
      durationMinutes: 30,
      passingScore: 700,
      selection: { kind: 'fixed', questionIds: ['q-single', 'q-multi'] },
      caseStudies: [
        {
          id: 'cs-1',
          title: 'Contoso setup',
          background: 'Contoso ingests telemetry daily.',
          questionIds: ['q-single'],
        },
      ],
    },
    {
      id: 'exam-sampled',
      title: 'Randomized quiz',
      durationMinutes: 15,
      selection: { kind: 'sampled', domainPlan: { d1: 2, d2: 2 }, seed: 42, excludeExamIds: ['exam-fixed'] },
    },
  ],
  comparisons: [
    {
      id: 'cmp-1',
      title: 'Files vs tables',
      columns: [
        { id: 'files', label: 'Files' },
        { id: 'tables', label: 'Tables' },
      ],
      rows: [
        { aspect: 'Storage', cells: { files: 'Blob/path', tables: 'Metadata over files' } },
        { aspect: 'Access', cells: { files: 'Direct read', tables: 'SQL' } },
      ],
      samples: [
        {
          label: 'Read a row count',
          code: { files: "grep -c ',' data.csv", tables: 'SELECT COUNT(*) FROM t;' },
        },
      ],
      migration: {
        equivalent: 'Both store rows.',
        different: 'Tables add schema + transactional guarantees.',
        directMigration: 'External tables over existing files.',
        syntaxChanges: 'Path-based reads become SELECTs.',
        limitations: 'File ACLs bypass table grants.',
        whenToUse: 'Files for landing, tables for serving.',
      },
    },
  ],
};
