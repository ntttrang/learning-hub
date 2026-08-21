import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "./store";

function reset() {
  useStore.getState().resetProgress();
}

describe("progress store", () => {
  beforeEach(reset);

  it("marks a lesson complete and grants the first-lesson badge", () => {
    useStore.getState().markLesson("l0101", "completed");
    const s = useStore.getState();
    expect(s.lessons["l0101"].status).toBe("completed");
    expect(s.achievements.some((a) => a.id === "first-lesson")).toBe(true);
    expect(s.streak.current).toBe(1);
  });

  it("toggles bookmarks", () => {
    const { toggleBookmark } = useStore.getState();
    toggleBookmark("l0103");
    expect(useStore.getState().bookmarks).toContain("l0103");
    toggleBookmark("l0103");
    expect(useStore.getState().bookmarks).not.toContain("l0103");
  });

  it("records a quiz, feeds SRS with missed questions, and grants quiz-ace on perfect", () => {
    useStore.getState().recordQuiz({
      id: "quiz-1",
      scope: "m01",
      date: new Date().toISOString(),
      total: 2,
      correct: 1,
      questionResults: [
        { questionId: "q-l0101-1", correct: true },
        { questionId: "q-l0101-2", correct: false },
      ],
    });
    const s = useStore.getState();
    expect(s.quizAttempts.length).toBe(1);
    expect(s.srs["q-l0101-2"]).toBeDefined(); // missed -> tracked
    expect(s.achievements.some((a) => a.id === "quiz-ace")).toBe(false);

    useStore.getState().recordQuiz({
      id: "quiz-2",
      scope: "m01",
      date: new Date().toISOString(),
      total: 1,
      correct: 1,
      questionResults: [{ questionId: "q-l0101-1", correct: true }],
    });
    expect(useStore.getState().achievements.some((a) => a.id === "quiz-ace")).toBe(true);
  });

  it("records an exam and grants mock-pass when passed", () => {
    useStore.getState().recordExam({
      id: "exam-1",
      examId: "mock-1",
      date: new Date().toISOString(),
      durationSeconds: 100,
      timed: true,
      scaledScore: 800,
      passed: true,
      perDomain: [{ domainId: "d1", correct: 5, total: 5 }],
      answers: {},
      results: [{ questionId: "q-l0101-1", correct: true }],
    });
    const s = useStore.getState();
    expect(s.examAttempts.length).toBe(1);
    expect(s.achievements.some((a) => a.id === "mock-pass")).toBe(true);
  });

  it("completes a lab and grants first-lab", () => {
    useStore.getState().completeLab("lab-json", "d1");
    const s = useStore.getState();
    expect(s.completedLabs).toContain("lab-json");
    expect(s.achievements.some((a) => a.id === "first-lab")).toBe(true);
  });
});
