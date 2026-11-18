import { redirect } from "next/navigation";

/** Las sedes se editan en un panel sobre la lista; esta dirección queda para enlaces viejos. */
export default async function EditLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/contenido/sedes?editar=${encodeURIComponent(id)}`);
}
