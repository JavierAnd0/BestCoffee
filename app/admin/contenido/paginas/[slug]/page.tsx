import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminPage } from "@/lib/data/admin-content";
import { CONTENT_PAGES, isContentPageSlug } from "@/lib/editorial-pages";
import { LoadError, SectionHeader } from "../../_components/fields";
import { PageForm } from "../page-form";

export const metadata: Metadata = { title: "Editar página · Admin" };

export default async function EditEditorialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isContentPageSlug(slug)) notFound();
  const meta = CONTENT_PAGES.find((p) => p.slug === slug)!;
  const res = await getAdminPage(slug);
  if (!res.ok && res.status === 404) notFound();
  return (
    <div>
      <SectionHeader title={meta.label} description={`Se publica en ${meta.path}. ${meta.help}`} />
      {!res.ok ? (
        <LoadError error={res.error} />
      ) : (
        <PageForm slug={slug} content={res.data?.content ?? null} active={res.data?.active ?? false} />
      )}
    </div>
  );
}
