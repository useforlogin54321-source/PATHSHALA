import { notFound } from "next/navigation";
import { getSubjects, getUnit } from "@/lib/content";
import UnitView from "@/components/UnitView";

export default async function UnitPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; unitNumber: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const { slug, unitNumber } = await params;
  const { section } = await searchParams;
  const subjects = await getSubjects();
  const subject = subjects.find((s) => s.slug === slug);
  const unit = await getUnit(slug, unitNumber);

  if (!subject || !unit) notFound();

  return (
    <UnitView subjectSlug={slug} subjectName={subject.name} unit={unit} initialSection={section} />
  );
}
