import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContentBlock } from "@/lib/data/admin-content";
import { LoadError, SectionHeader } from "../../_components/fields";
import { BLOCK_KINDS } from "../../_components/block-kinds";
import { BlockForm } from "../block-form";
import { productOptions } from "../products";

export const metadata: Metadata = { title: "Editar bloque · Admin" };

export default async function EditBlockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getContentBlock(id);
  if (!res.ok && res.status === 404) notFound();
  if (!res.ok) return <LoadError error={res.error} />;
  const block = res.data;
  if (!block) notFound();
  const products =
    block.kind === "SPOTLIGHT" || block.kind === "FEATURED_BUNDLE" ? await productOptions() : [];
  return (
    <div>
      <SectionHeader title={`Editar bloque · ${BLOCK_KINDS[block.kind].label}`} />
      <BlockForm kind={block.kind} block={block} products={products} />
    </div>
  );
}
