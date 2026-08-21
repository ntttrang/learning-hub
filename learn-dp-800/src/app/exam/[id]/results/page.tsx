import { MOCK_EXAMS } from "@/lib/content";
import ResultsClient from "./ResultsClient";

export function generateStaticParams() {
  return MOCK_EXAMS.map((e) => ({ id: e.id }));
}

export default function ResultsPage() {
  return <ResultsClient />;
}
