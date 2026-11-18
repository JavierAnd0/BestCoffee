import { redirect } from "next/navigation";

/**
 * Los bloques se editan en la misma lista de Contenido. Esta dirección queda
 * solo para enlaces viejos o guardados: abre el bloque ahí mismo.
 */
export default async function EditBlockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/contenido?editar=${encodeURIComponent(id)}`);
}
