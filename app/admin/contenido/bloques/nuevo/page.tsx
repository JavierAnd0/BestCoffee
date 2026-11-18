import { redirect } from "next/navigation";
import { isContentKind } from "../../_components/block-kinds";

/**
 * Los bloques nuevos se crean en la misma lista de Contenido. Esta dirección
 * queda solo para enlaces viejos o guardados.
 */
export default async function NewBlockPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo } = await searchParams;
  redirect(isContentKind(tipo) ? `/admin/contenido?nuevo=${tipo}` : "/admin/contenido");
}
