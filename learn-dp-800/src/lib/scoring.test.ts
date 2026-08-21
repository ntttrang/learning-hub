import { describe, it, expect } from "vitest";
import {
  gradeQuestion,
  scoreQuestions,
  toScaledScore,
  scoreByDomain,
  sameSet,
  sameOrder,
  normalizeSqlBlank,
} from "./scoring";
import type { Question } from "./types";

const single: Question = {
  id: "q1", domainId: "d1", type: "single", difficulty: "beginner",
  prompt: "p", options: [{ id: "a", text: "" }, { id: "b", text: "" }], correct: ["a"], explanation: "",
};
const multi: Question = {
  id: "q2", domainId: "d1", type: "multi", difficulty: "beginner",
  prompt: "p", options: [{ id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }], correct: ["a", "c"], explanation: "",
};
const ordering: Question = {
  id: "q3", domainId: "d2", type: "ordering", difficulty: "beginner",
  prompt: "p", options: [{ id: "x", text: "" }, { id: "y", text: "" }, { id: "z", text: "" }], correct: ["x", "y", "z"], explanation: "",
};
const matching: Question = {
  id: "q4", domainId: "d3", type: "matching", difficulty: "beginner",
  prompt: "p", pairs: [{ left: "L1", right: "R1" }, { left: "L2", right: "R2" }], explanation: "",
};

describe("set/order helpers", () => {
  it("sameSet ignores order", () => {
    expect(sameSet(["a", "b"], ["b", "a"])).toBe(true);
    expect(sameSet(["a"], ["a", "b"])).toBe(false);
  });
  it("sameOrder respects order", () => {
    expect(sameOrder(["a", "b"], ["a", "b"])).toBe(true);
    expect(sameOrder(["a", "b"], ["b", "a"])).toBe(false);
  });
});

describe("gradeQuestion", () => {
  it("grades single", () => {
    expect(gradeQuestion(single, ["a"])).toBe(true);
    expect(gradeQuestion(single, ["b"])).toBe(false);
    expect(gradeQuestion(single, [])).toBe(false);
  });
  it("grades multi (exact set)", () => {
    expect(gradeQuestion(multi, ["a", "c"])).toBe(true);
    expect(gradeQuestion(multi, ["c", "a"])).toBe(true);
    expect(gradeQuestion(multi, ["a"])).toBe(false);
    expect(gradeQuestion(multi, ["a", "b", "c"])).toBe(false);
  });
  it("grades ordering (exact order)", () => {
    expect(gradeQuestion(ordering, ["x", "y", "z"])).toBe(true);
    expect(gradeQuestion(ordering, ["y", "x", "z"])).toBe(false);
  });
  it("grades matching via tokens", () => {
    expect(gradeQuestion(matching, ["0::R1", "1::R2"])).toBe(true);
    expect(gradeQuestion(matching, ["0::R2", "1::R1"])).toBe(false);
    expect(gradeQuestion(matching, ["0::R1"])).toBe(false);
  });
});

const sqlFill: Question = {
  id: "q5", domainId: "d1", type: "sqlFill", difficulty: "beginner",
  prompt: "p",
  code: "CROSS APPLY ____(p.Attr, '$.tags') t;",
  correct: ["OPENJSON"],
  blankAliases: [["OPEN_JSON"]],
  explanation: "",
};

describe("normalizeSqlBlank", () => {
  it("trims, folds case, strips wrapping brackets, collapses space", () => {
    expect(normalizeSqlBlank("  openjson  ")).toBe("OPENJSON");
    expect(normalizeSqlBlank("[OPENJSON]")).toBe("OPENJSON");
    expect(normalizeSqlBlank("ROW   START")).toBe("ROW START");
  });
});

describe("gradeQuestion sqlFill", () => {
  it("accepts canonical, case, whitespace, and aliases", () => {
    expect(gradeQuestion(sqlFill, ["OPENJSON"])).toBe(true);
    expect(gradeQuestion(sqlFill, ["openjson"])).toBe(true);
    expect(gradeQuestion(sqlFill, [" OPENJSON "])).toBe(true);
    expect(gradeQuestion(sqlFill, ["[OPENJSON]"])).toBe(true);
    expect(gradeQuestion(sqlFill, ["OPEN_JSON"])).toBe(true);
  });
  it("rejects empty, wrong token, and length mismatch", () => {
    expect(gradeQuestion(sqlFill, [""])).toBe(false);
    expect(gradeQuestion(sqlFill, ["JSON_VALUE"])).toBe(false);
    expect(gradeQuestion(sqlFill, [])).toBe(false);
    expect(gradeQuestion(sqlFill, ["OPENJSON", "extra"])).toBe(false);
  });
});

describe("scoreQuestions", () => {
  it("aggregates correctly", () => {
    const res = scoreQuestions([single, multi], { q1: ["a"], q2: ["a"] });
    expect(res.total).toBe(2);
    expect(res.correct).toBe(1);
    expect(res.accuracy).toBeCloseTo(0.5);
  });
});

describe("toScaledScore", () => {
  it("maps accuracy into 100..1000 band", () => {
    expect(toScaledScore(0)).toBe(100);
    expect(toScaledScore(1)).toBe(1000);
    expect(toScaledScore(0.7)).toBe(730);
  });
});

describe("scoreByDomain", () => {
  it("groups by domain", () => {
    const results = [
      { questionId: "q1", correct: true },
      { questionId: "q2", correct: false },
      { questionId: "q3", correct: true },
    ];
    const byDomain = scoreByDomain([single, multi, ordering], results);
    const d1 = byDomain.find((b) => b.domainId === "d1")!;
    expect(d1.total).toBe(2);
    expect(d1.correct).toBe(1);
    const d2 = byDomain.find((b) => b.domainId === "d2")!;
    expect(d2.correct).toBe(1);
  });
});
