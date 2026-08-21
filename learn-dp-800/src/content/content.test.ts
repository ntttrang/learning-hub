import { describe, it, expect } from "vitest";
import {
  LESSONS,
  QUESTIONS,
  LABS,
  MOCK_EXAMS,
  MODULES,
  DOMAINS,
  LAB_CODING_SETS,
  getQuestion,
  getLesson,
} from "@/lib/content";
import { gradeQuestion } from "@/lib/scoring";

describe("curriculum integrity", () => {
  it("has 3 domains and 11 modules", () => {
    expect(DOMAINS.length).toBe(3);
    expect(MODULES.length).toBe(11);
  });

  it("has ~40+ lessons with unique slugs and ids", () => {
    expect(LESSONS.length).toBeGreaterThanOrEqual(40);
    const slugs = new Set(LESSONS.map((l) => l.slug));
    const ids = new Set(LESSONS.map((l) => l.id));
    expect(slugs.size).toBe(LESSONS.length);
    expect(ids.size).toBe(LESSONS.length);
  });

  it("every module belongs to a real domain and lists real lessons", () => {
    for (const m of MODULES) {
      expect(DOMAINS.some((d) => d.id === m.domainId)).toBe(true);
      for (const lid of m.lessonIds) {
        expect(getLesson(lid), `module ${m.id} references missing lesson ${lid}`).toBeDefined();
      }
    }
  });

  it("has at least one flagship lesson per domain", () => {
    for (const d of DOMAINS) {
      const flagships = LESSONS.filter((l) => l.domainId === d.id && l.flagship);
      expect(flagships.length, `domain ${d.id} needs a flagship`).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("question references", () => {
  it("every knowledge-check question id resolves", () => {
    for (const l of LESSONS) {
      for (const qid of l.knowledgeCheck.questionIds) {
        expect(getQuestion(qid), `lesson ${l.id} references missing question ${qid}`).toBeDefined();
      }
    }
  });

  it("every lesson has at least 2 knowledge-check questions", () => {
    for (const l of LESSONS) {
      expect(l.knowledgeCheck.questionIds.length, `lesson ${l.id}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("every exam question id resolves and belongs to its exam", () => {
    for (const exam of MOCK_EXAMS) {
      for (const qid of exam.questionIds) {
        expect(getQuestion(qid), `exam ${exam.id} references missing question ${qid}`).toBeDefined();
      }
    }
  });

  it("case study question ids are included in the exam question list", () => {
    for (const exam of MOCK_EXAMS) {
      for (const cs of exam.caseStudies ?? []) {
        for (const qid of cs.questionIds) {
          expect(exam.questionIds).toContain(qid);
        }
      }
    }
  });
});

describe("question correctness is well-formed", () => {
  it("each question is answerable with its own key", () => {
    for (const q of QUESTIONS) {
      if (q.type === "matching") {
        const key = (q.pairs ?? []).map((p, i) => `${i}::${p.right}`);
        expect(gradeQuestion(q, key), `matching ${q.id}`).toBe(true);
      } else if (q.type === "ordering") {
        expect(gradeQuestion(q, q.correct ?? []), `ordering ${q.id}`).toBe(true);
      } else if (q.type === "sqlFill") {
        const blanks = (q.code?.match(/____/g) ?? []).length;
        expect(blanks, `sqlFill ${q.id} blank count`).toBe((q.correct ?? []).length);
        expect((q.correct ?? []).length, `sqlFill ${q.id} needs tokens`).toBeGreaterThanOrEqual(1);
        expect(gradeQuestion(q, q.correct ?? []), `sqlFill ${q.id}`).toBe(true);
      } else {
        expect((q.correct ?? []).length, `question ${q.id} needs a correct answer`).toBeGreaterThanOrEqual(1);
        expect(gradeQuestion(q, q.correct ?? []), `choice ${q.id}`).toBe(true);
        // correct ids must exist among options
        const optIds = new Set((q.options ?? []).map((o) => o.id));
        for (const c of q.correct ?? []) expect(optIds.has(c), `q ${q.id} correct ${c}`).toBe(true);
      }
    }
  });
});

describe("lab coding sets", () => {
  const minCount: Record<string, number> = {
    "lab-01": 6,
    "lab-02": 6,
    "lab-03": 6,
    "lab-04": 4,
    "lab-05": 6,
    "lab-06": 6,
    "lab-07": 4,
    "lab-08": 4,
    "lab-09": 6,
    "lab-10": 6,
    "lab-11": 6,
  };

  it("has 11 sets, one per module", () => {
    expect(LAB_CODING_SETS.length).toBe(11);
    expect(new Set(LAB_CODING_SETS.map((s) => s.moduleId))).toEqual(new Set(MODULES.map((m) => m.id)));
  });

  it("each set meets the count and every id resolves to a lab-coding question", () => {
    for (const s of LAB_CODING_SETS) {
      expect(s.questionIds.length, s.id).toBeGreaterThanOrEqual(minCount[s.id] ?? 4);
      for (const id of s.questionIds) {
        const q = getQuestion(id);
        expect(q, id).toBeDefined();
        expect(q?.tags?.includes("lab-coding"), id).toBe(true);
        if (q?.lessonId) expect(getLesson(q.lessonId), `${id} lesson`).toBeDefined();
      }
    }
  });

  it("does not copy Microsoft lab identifiers", () => {
    const blob = QUESTIONS.filter((q) => q.tags?.includes("lab-coding"))
      .map((q) => [q.prompt, q.code ?? "", q.explanation, ...(q.options?.map((o) => o.text) ?? [])].join("\n"))
      .join("\n");
    for (const forbidden of ["EcommerceDB", "AdventureWorksLT", "AddOrderLineItem", "SecurityLabDB"]) {
      expect(blob.includes(forbidden), forbidden).toBe(false);
    }
  });

  it("every lab-coding question is exam-style A/B/C/D (single or select-two)", () => {
    const allowed = new Set(["single", "codeReading", "debugging", "multi"]);
    const hard = new Set(["advanced", "challenge"]);
    for (const s of LAB_CODING_SETS) {
      const types = new Set<string>();
      for (const id of s.questionIds) {
        const q = getQuestion(id)!;
        types.add(q.type);
        expect(allowed.has(q.type), `${id} type ${q.type}`).toBe(true);
        expect(hard.has(q.difficulty), `${id} difficulty ${q.difficulty}`).toBe(true);
        expect(q.options?.map((o) => o.id), id).toEqual(["a", "b", "c", "d"]);
        expect(q.prompt.length, `${id} stem too short`).toBeGreaterThan(120);
        if (q.type === "multi") {
          expect(q.correct, id).toHaveLength(2);
        } else {
          expect(q.correct, id).toHaveLength(1);
        }
      }
      expect(types.has("multi"), `${s.id} needs a select-two item`).toBe(true);
    }
  });
});

describe("labs", () => {
  it("has one lab per domain and valid lesson links", () => {
    for (const d of DOMAINS) {
      expect(LABS.some((l) => l.domainId === d.id), `domain ${d.id} needs a lab`).toBe(true);
    }
    for (const lab of LABS) {
      if (lab.lessonId) expect(getLesson(lab.lessonId), `lab ${lab.id}`).toBeDefined();
      expect(lab.steps.length).toBeGreaterThanOrEqual(3);
    }
  });
});
