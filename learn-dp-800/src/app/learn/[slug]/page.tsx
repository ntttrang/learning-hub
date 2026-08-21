import { notFound } from "next/navigation";
import { LESSONS, getLessonBySlug } from "@/lib/content";
import { LessonViewer } from "@/components/LessonViewer";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }));
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) notFound();
  return <LessonViewer lesson={lesson} />;
}
