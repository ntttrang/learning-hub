import type { Exam, Question, SubjectContent } from '../sdk/types';
import { sampleExam } from './sampling';

/**
 * Deterministic paper assembly — the one place the sitting and the review both
 * derive a paper from. Fixed selections keep their authored order; sampled
 * selections draw through the sampling engine, so the same bank always yields
 * the same paper and the review replays exactly what was served. Cross-exam
 * exclusion resolves each named exam's served questions first, which is what
 * keeps one mock from re-serving another's questions.
 */
export function assemblePaper(content: SubjectContent, exam: Exam): Question[] {
  return collectPaper(content, exam, new Set([exam.id]));
}

function collectPaper(content: SubjectContent, exam: Exam, seen: Set<string>): Question[] {
  if (exam.selection.kind === 'fixed') {
    // Authored order matters here; validated packs resolve every id, but a
    // miss degrades away rather than poisoning the paper with an undefined.
    const byId = new Map(content.questions.map((question) => [question.id, question] as const));
    return exam.selection.questionIds.flatMap((id) => {
      const question = byId.get(id);
      return question ? [question] : [];
    });
  }

  const excluded = new Set<string>();
  for (const excludedId of exam.selection.excludeExamIds ?? []) {
    const other = content.exams.find((candidate) => candidate.id === excludedId);
    // A cycle back into an exam already on the resolution chain serves nothing.
    if (!other || seen.has(other.id)) continue;
    for (const question of collectPaper(content, other, new Set([...seen, other.id]))) {
      excluded.add(question.id);
    }
  }
  return sampleExam(exam, content.questions, excluded);
}
