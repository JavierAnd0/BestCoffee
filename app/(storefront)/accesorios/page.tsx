import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { requireFeature } from "@/lib/data/feature-guard";
import { listAccessories } from "@/lib/data/products";
import { AccessoriesCatalog } from "@/components/storefront/accessories-catalog";
import { ArrowRight, Wrench, ShieldCheck, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Accesorios & Barismo",
  description:
    "Herramientas de precisión para baristas y amantes del café: molinos de muelas cónicas, teteras cuello de cisne, tazas de cerámica y métodos de filtrado.",
};

const PERKS = [
  {
    icon: <ShieldCheck className="size-5 text-primary" />,
    title: "Garantía oficial de 1 año",
    desc: "Respaldamos todos los componentes mecánicos y electrónicos contra defectos de fabricación.",
  },
  {
    icon: <Wrench className="size-5 text-primary" />,
    title: "Calibración y repuestos",
    desc: "Te asesoramos en el ajuste de molienda y proveemos empaques y filtros originales.",
  },
  {
    icon: <Sparkles className="size-5 text-primary" />,
    title: "Materiales grado alimenticio",
    desc: "Acero inoxidable 304, aluminio anodizado y cerámica gres libre de plomo.",
  },
];

export default async function AccesoriosPage() {
  // Guard de feature del tenant: si la tienda no vende accesorios, redirige a /catalogo
  await requireFeature("accessories");

  const accessories = await listAccessories();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      {/* Migas de pan */}
      <nav className="text-xs text-muted-foreground mb-4">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>{" "}
        / <span className="text-foreground">Accesorios & Equipos</span>
      </nav>

      {/* Encabezado */}
      <header className="mb-10 max-w-3xl">
        <Eyebrow>Herramientas de Barismo</Eyebrow>
        <h1 className="mt-3 font-display text-4xl lg:text-5xl font-semibold tracking-tight">
          Accesorios & Métodos
        </h1>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed">
          Tazas de cerámica artesanal, teteras cuello de cisne para vertidos controlados, molinos de muelas cónicas y básculas de alta precisión pensadas para sacar el máximo potencial a cada taza.
        </p>
      </header>

      {/* Catálogo de accesorios interactivo */}
      <AccessoriesCatalog initialAccessories={accessories} />

      {/* Ventajas */}
      <section className="mt-20 border-t border-border pt-14 grid sm:grid-cols-3 gap-6">
        {PERKS.map((p) => (
          <div
            key={p.title}
            className="rounded-xl border border-border bg-card p-5 space-y-2 text-card-foreground"
          >
            <div className="size-9 rounded-lg bg-primary/10 grid place-items-center mb-3">
              {p.icon}
            </div>
            <h3 className="font-display text-lg font-semibold tracking-tight">
              {p.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </section>

      {/* Banner inferior */}
      <section className="mt-16 rounded-2xl border border-border bg-muted/30 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="max-w-xl">
          <h3 className="font-display text-2xl font-semibold tracking-tight">
            ¿Buscas café fresco para tus equipos?
          </h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Nuestros lotes de Huila, Nariño y Sierra Nevada se tuestan semanalmente para garantizar notas vibrantes en cualquier método.
          </p>
        </div>
        <Link href="/catalogo">
          <Button className="gap-2">
            Ver cafés en grano <ArrowRight className="size-4" />
          </Button>
        </Link>
      </section>
    </div>
  );
}

