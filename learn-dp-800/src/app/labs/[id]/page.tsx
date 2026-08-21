import { notFound } from "next/navigation";
import { LABS, getLab } from "@/lib/content";
import { LabViewer } from "@/components/LabViewer";

export function generateStaticParams() {
  return LABS.map((l) => ({ id: l.id }));
}

export default async function LabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lab = getLab(id);
  if (!lab) notFound();
  return <LabViewer lab={lab} />;
}
