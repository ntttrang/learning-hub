import { describe, it, expect } from "vitest";
import { createCard, reviewCard, dueCards, ingestResults, BOX_INTERVALS_DAYS, MAX_BOX } from "./srs";

const NOW = "2026-07-28T00:00:00.000Z";

describe("reviewCard", () => {
  it("promotes on correct and extends due date", () => {
    const card = createCard("q1", NOW);
    const next = reviewCard(card, true, NOW);
    expect(next.box).toBe(2);
    expect(next.timesCorrect).toBe(1);
    expect(new Date(next.due).getTime()).toBeGreaterThan(new Date(NOW).getTime());
  });
  it("resets to box 1 on wrong", () => {
    let card = createCard("q1", NOW);
    card = reviewCard(card, true, NOW); // box 2
    card = reviewCard(card, true, NOW); // box 3
    const wrong = reviewCard(card, false, NOW);
    expect(wrong.box).toBe(1);
    expect(wrong.timesWrong).toBe(1);
  });
  it("caps at MAX_BOX", () => {
    let card = createCard("q1", NOW);
    for (let i = 0; i < 10; i++) card = reviewCard(card, true, NOW);
    expect(card.box).toBe(MAX_BOX);
  });
});

describe("dueCards", () => {
  it("returns only cards due at now, sorted by due asc", () => {
    const c1 = { ...createCard("a", NOW), due: "2026-07-27T00:00:00.000Z" };
    const c2 = { ...createCard("b", NOW), due: "2026-08-10T00:00:00.000Z" };
    const c3 = { ...createCard("c", NOW), due: "2026-07-20T00:00:00.000Z" };
    const due = dueCards([c1, c2, c3], NOW);
    expect(due.map((c) => c.questionId)).toEqual(["c", "a"]);
  });
});

describe("ingestResults", () => {
  it("tracks a missed question but not an untracked correct one", () => {
    const next = ingestResults({}, [
      { questionId: "wrong", correct: false },
      { questionId: "right", correct: true },
    ], NOW);
    expect(next.wrong).toBeDefined();
    expect(next.right).toBeUndefined();
  });
  it("updates an existing tracked card on correct", () => {
    const start = { q1: createCard("q1", NOW) };
    const next = ingestResults(start, [{ questionId: "q1", correct: true }], NOW);
    expect(next.q1.box).toBe(2);
  });
});

describe("intervals", () => {
  it("has one interval per box", () => {
    expect(BOX_INTERVALS_DAYS.length).toBe(MAX_BOX + 1);
  });
});
