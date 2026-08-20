import { describe, expect, it } from 'vitest';
import {
  clearInflight,
  EXAM_INFLIGHT_KEY,
  loadInflight,
  saveInflight,
  type InflightSitting,
} from './exam-inflight';
import { createMemoryAdapter, type StorageAdapter } from './storage';

const timedSitting: InflightSitting = {
  subjectId: 'fixture',
  examId: 'exam-case-study',
  timed: true,
  startedAt: 1_000,
  deadline: 601_000,
  answers: { 'q-single': ['files'] },
  flags: ['q-multi'],
};

function draw(stored: unknown): StorageAdapter {
  const adapter = createMemoryAdapter();
  if (stored !== null) adapter.setItem(EXAM_INFLIGHT_KEY, JSON.stringify(stored));
  return adapter;
}

describe('exam in-flight persistence', () => {
  it('round-trips a timed sitting through the adapter', () => {
    const adapter = createMemoryAdapter();
    saveInflight(timedSitting, adapter);

    expect(loadInflight(adapter)).toEqual(timedSitting);
    clearInflight(adapter);
    expect(loadInflight(adapter)).toBeNull();
  });

  it('drops the deadline when persisting an untimed sitting', () => {
    const adapter = createMemoryAdapter();
    const untimed: InflightSitting = { ...timedSitting, timed: false, deadline: 601_000 };
    saveInflight(untimed, adapter);

    const loaded = loadInflight(adapter);
    expect(loaded).toMatchObject({ timed: false });
    expect(loaded?.deadline).toBeUndefined();
  });

  it('returns null when nothing is stored', () => {
    expect(loadInflight(createMemoryAdapter())).toBeNull();
  });

  it('rejects unreadable and non-object blobs', () => {
    const adapter = createMemoryAdapter();
    adapter.setItem(EXAM_INFLIGHT_KEY, 'not json {');
    expect(loadInflight(adapter)).toBeNull();

    expect(loadInflight(draw('a string'))).toBeNull();
    expect(loadInflight(draw(42))).toBeNull();
    expect(loadInflight(draw(null))).toBeNull();
    expect(loadInflight(draw([]))).toBeNull();
  });

  it('rejects records with missing or wrongly-typed core fields', () => {
    expect(loadInflight(draw({ ...timedSitting, subjectId: 7 }))).toBeNull();
    expect(loadInflight(draw({ ...timedSitting, examId: undefined }))).toBeNull();
    expect(loadInflight(draw({ ...timedSitting, timed: 'yes' }))).toBeNull();
    expect(loadInflight(draw({ ...timedSitting, startedAt: Number.NaN }))).toBeNull();
    expect(loadInflight(draw({ ...timedSitting, answers: null }))).toBeNull();
    expect(loadInflight(draw({ ...timedSitting, answers: [] }))).toBeNull();
    expect(loadInflight(draw({ ...timedSitting, flags: 'q-multi' }))).toBeNull();
    expect(loadInflight(draw({ ...timedSitting, flags: [1, 2] }))).toBeNull();
  });

  it('rejects answer maps that hold non-string entries', () => {
    expect(loadInflight(draw({ ...timedSitting, answers: { 'q-single': 'files' } }))).toBeNull();
    expect(
      loadInflight(draw({ ...timedSitting, answers: { 'q-single': ['ok', 3] } })),
    ).toBeNull();
  });

  it('rejects a timed sitting without a usable deadline', () => {
    const { deadline: _drop, ...withoutDeadline } = timedSitting;
    expect(loadInflight(draw(withoutDeadline))).toBeNull();
    expect(loadInflight(draw({ ...timedSitting, deadline: Number.NaN }))).toBeNull();
  });
});
