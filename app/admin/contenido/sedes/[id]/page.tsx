import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminLocation } from "@/lib/data/admin-content";
import { LoadError, SectionHeader } from "../../_components/fields";
import { LocationForm } from "../location-form";

export const metadata: Metadata = { title: "Editar sede · Admin" };

export default async function EditLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getAdminLocation(id);
  if (!res.ok && res.status === 404) notFound();
  if (res.ok && !res.data) notFound();
  return (
    <div>
      <SectionHeader title="Editar sede" />
      {!res.ok ? <LoadError error={res.error} /> : res.data && <LocationForm location={res.data} />}
    </div>
  );
}
