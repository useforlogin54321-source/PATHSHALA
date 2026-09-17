import { notFound } from "next/navigation";
import { getSubjects, getUnit } from "@/lib/content";
import UnitView from "@/components/UnitView";

export default async function UnitPage({
  params,
}: {
  params: Promise<{ slug: string; unitNumber: string }>;
}) {
  const { slug, unitNumber } = await params;
  const subjects = await getSubjects();
  const subject = subjects.find((s) => s.slug === slug);
  const unit = await getUnit(slug, unitNumber);

  if (!subject || !unit) notFound();

  return <UnitView subjectSlug={slug} subjectName={subject.name} unit={unit} />;
}
