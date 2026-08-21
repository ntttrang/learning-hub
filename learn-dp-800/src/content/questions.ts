import type { Question } from "@/lib/types";
import { D1_QUESTIONS } from "./questions/domain1";
import { D2_QUESTIONS } from "./questions/domain2";
import { D3_QUESTIONS } from "./questions/domain3";
import { EXAM1_QUESTIONS, EXAM1_CASE_QUESTIONS } from "./questions/exam1";
import { LAB_CODING_QUESTIONS } from "./questions/lab-coding";

export const QUESTIONS: Question[] = [
  ...D1_QUESTIONS,
  ...D2_QUESTIONS,
  ...D3_QUESTIONS,
  ...EXAM1_QUESTIONS,
  ...EXAM1_CASE_QUESTIONS,
  ...LAB_CODING_QUESTIONS,
];
