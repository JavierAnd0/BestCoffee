import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { PRODUCTS } from "@/lib/mocks/products";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = PRODUCTS.find((x) => x.id === id);
  return { title: p ? `${p.name} · Admin` : "Producto · Admin" };
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) notFound();

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/productos"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a productos
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
        {product.name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground mb-8">
        Edita los datos del producto. Los cambios se sincronizan con Stripe al guardar.
      </p>
      <ProductForm product={product} />
    </div>
  );
}
