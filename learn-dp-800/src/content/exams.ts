import type { MockExam } from "@/lib/types";

/**
 * Mock exams built from the original question bank. Question mix approximates the
 * official domain weights (D1 ~37%, D2 ~37%, D3 ~26%). No real exam items are used.
 */

const EXAM1_STANDALONE = [
  // Domain 1 (17)
  "q-ex1-1", "q-ex1-2", "q-ex1-10",
  "q-l0101-1", "q-l0102-1", "q-l0103-2", "q-l0103-3", "q-l0104-2",
  "q-l0105-1", "q-l0106-1", "q-l0201-1", "q-l0202-1", "q-l0203-1",
  "q-l0301-1", "q-l0302-2", "q-l0304-1", "q-l0305-1",
  // Domain 2 (17)
  "q-ex1-3", "q-ex1-4", "q-ex1-5", "q-ex1-9",
  "q-l0501-1", "q-l0502-1", "q-l0503-1", "q-l0503-4", "q-l0503-5",
  "q-l0504-2", "q-l0505-1", "q-l0602-2", "q-l0603-1", "q-l0604-1",
  "q-l0701-1", "q-l0801-1", "q-l0804-1",
  // Domain 3 (11)
  "q-ex1-6", "q-ex1-7", "q-ex1-8",
  "q-l0901-1", "q-l0902-1", "q-l0903-1", "q-l1001-1",
  "q-l1002-2", "q-l1002-3", "q-l1003-1", "q-l1101-1",
];

const EXAM1_CASE = ["q-cs1-1", "q-cs1-2", "q-cs1-3", "q-cs1-4", "q-cs1-5"];

const EXAM2 = [
  // Domain 1 (11)
  "q-l0101-2", "q-l0103-1", "q-l0103-4", "q-l0103-5", "q-l0104-1",
  "q-l0105-2", "q-l0106-2", "q-l0302-1", "q-l0302-3", "q-l0303-1", "q-l0402-1",
  // Domain 2 (11)
  "q-l0501-2", "q-l0501-3", "q-l0503-2", "q-l0503-3", "q-l0602-1",
  "q-l0603-2", "q-l0603-3", "q-l0701-2", "q-l0704-2", "q-l0802-1", "q-l0803-1",
  // Domain 3 (8)
  "q-l0901-2", "q-l0902-2", "q-l0903-2", "q-l1001-2",
  "q-l1002-1", "q-l1002-5", "q-l1101-3", "q-l1102-1",
];

export const MOCK_EXAMS: MockExam[] = [
  {
    id: "mock-1",
    title: "DP-800 Mock Exam 1",
    description:
      "A full-length, original 50-question exam mirroring the DP-800 format: standalone questions across all three domains plus a five-question case study.",
    durationMinutes: 70,
    passingScore: 700,
    questionIds: [...EXAM1_STANDALONE, ...EXAM1_CASE],
    caseStudies: [
      {
        id: "cs-1",
        title: "Case study: Contoso Support semantic search",
        background:
          "Contoso runs a support portal with **2 million knowledge-base articles** stored in **Azure SQL Database**. The team wants to add AI-powered search and a grounded assistant **without moving data** to a separate vector store. Users search both by exact error codes and by natural-language questions. Security requires that the assistant call the model **without any stored secrets**.",
        questionIds: EXAM1_CASE,
      },
    ],
  },
  {
    id: "mock-2",
    title: "DP-800 Mock Exam 2",
    description:
      "A second full-length practice exam with a different 30-question set covering all three domains. Great for a second timed run before the real thing.",
    durationMinutes: 45,
    passingScore: 700,
    questionIds: EXAM2,
  },
];
