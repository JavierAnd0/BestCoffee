import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionHeader } from "../../_components/fields";
import { BLOCK_KINDS, isContentKind } from "../../_components/block-kinds";
import { BlockForm } from "../block-form";
import { productOptions } from "../products";

export const metadata: Metadata = { title: "Nuevo bloque · Admin" };

export default async function NewBlockPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo } = await searchParams;
  if (!isContentKind(tipo)) notFound();
  const products = tipo === "SPOTLIGHT" || tipo === "FEATURED_BUNDLE" ? await productOptions() : [];
  return (
    <div>
      <SectionHeader title={`Nuevo bloque · ${BLOCK_KINDS[tipo].label}`} />
      <BlockForm kind={tipo} products={products} />
    </div>
  );
}
