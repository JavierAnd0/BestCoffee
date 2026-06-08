import Link from "next/link";
import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Nuevo producto · Admin" };

export default function NewProductPage() {
  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/productos"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a productos
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
        Nuevo producto
      </h1>
      <p className="mt-1 text-sm text-muted-foreground mb-8">
        Define los datos del producto. Las variantes se sincronizan con Stripe al
        guardar.
      </p>
      <ProductForm />
    </div>
  );
}
