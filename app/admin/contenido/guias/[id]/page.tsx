import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminBrewGuide } from "@/lib/data/admin-content";
import { LoadError, SectionHeader } from "../../_components/fields";
import { GuideForm } from "../guide-form";

export const metadata: Metadata = { title: "Editar guía · Admin" };

export default async function EditGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getAdminBrewGuide(id);
  if (!res.ok && res.status === 404) notFound();
  if (res.ok && !res.data) notFound();
  return (
    <div>
      <SectionHeader title="Editar guía" />
      {!res.ok ? <LoadError error={res.error} /> : res.data && <GuideForm guide={res.data} />}
    </div>
  );
}
