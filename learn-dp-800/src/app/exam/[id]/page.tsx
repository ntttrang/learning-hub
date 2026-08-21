import { notFound } from "next/navigation";
import { MOCK_EXAMS, getExam } from "@/lib/content";
import { ExamEngine } from "@/components/ExamEngine";

export function generateStaticParams() {
  return MOCK_EXAMS.map((e) => ({ id: e.id }));
}

export default async function ExamRunnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exam = getExam(id);
  if (!exam) notFound();
  return <ExamEngine exam={exam} />;
}
