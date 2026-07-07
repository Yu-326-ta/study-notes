import { notFound } from "next/navigation";
import { getSystemDesignSourceBySlug } from "@/lib/data";
import { SystemDesignDocClient } from "@/components/systemdesign/SystemDesignDocClient";

type Props = { params: Promise<{ slug: string; sectionId: string }> };

export default async function SystemDesignSectionPage({ params }: Props) {
  const { slug, sectionId } = await params;
  const source = getSystemDesignSourceBySlug(slug);
  if (!source) notFound();
  const section = source.sections?.find((s) => s.id === sectionId);
  if (!section) notFound();
  return <SystemDesignDocClient source={source} sectionId={sectionId} />;
}
