import type { Question, QuestionType, DifficultyTier } from "@/lib/types";

interface QInput {
  id: string;
  domainId: string;
  moduleId: string;
  lessonId: string;
  type?: QuestionType;
  difficulty?: DifficultyTier;
  prompt: string;
  code?: string;
  /** options as [id, text]; mark correct via `correct`. */
  options?: [string, string][];
  correct?: string[];
  blankAliases?: string[][];
  pairs?: { left: string; right: string }[];
  explanation: string;
  tags?: string[];
}

/** Compact question builder to keep the large bank readable. */
export function q(input: QInput): Question {
  return {
    id: input.id,
    domainId: input.domainId,
    moduleId: input.moduleId,
    lessonId: input.lessonId,
    type: input.type ?? "single",
    difficulty: input.difficulty ?? "intermediate",
    prompt: input.prompt,
    code: input.code,
    options: input.options?.map(([id, text]) => ({ id, text })),
    correct: input.correct,
    blankAliases: input.blankAliases,
    pairs: input.pairs,
    explanation: input.explanation,
    tags: input.tags,
  };
}
