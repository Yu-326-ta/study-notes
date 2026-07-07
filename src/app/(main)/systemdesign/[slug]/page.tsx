import { redirect, notFound } from "next/navigation";
import { getSystemDesignSourceBySlug } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export default async function SystemDesignDocIndexPage({ params }: Props) {
  const { slug } = await params;
  const source = getSystemDesignSourceBySlug(slug);
  if (!source) notFound();
  const firstSection = source.sections?.[0];
  if (!firstSection) notFound();
  redirect(`/systemdesign/${slug}/${firstSection.id}`);
}
