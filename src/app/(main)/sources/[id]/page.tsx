import { notFound } from "next/navigation";
import { getSourceById } from "@/lib/data";
import { SourceDetailClient } from "@/components/sources/SourceDetailClient";

type Props = { params: Promise<{ id: string }> };

export default async function SourceDetailPage({ params }: Props) {
  const { id } = await params;
  const source = getSourceById(id);
  if (!source) notFound();
  return <SourceDetailClient source={source} />;
}
