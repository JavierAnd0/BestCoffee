import type { Metadata } from "next";
import { Calendar, Image as ImageIcon, MapPin, BookOpen, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Contenido · Admin" };

const PANELS = [
  {
    key: "announce",
    icon: Bell,
    title: "Anuncio barra superior",
    body: "Mensaje rotativo configurable. Hasta 5 mensajes activos.",
    cta: "Editar anuncio",
  },
  {
    key: "hero",
    icon: ImageIcon,
    title: "Hero de la home",
    body: "Imagen, titular y CTA. Programar por fechas (campañas temporales).",
    cta: "Editar hero",
  },
  {
    key: "spotlight",
    icon: BookOpen,
    title: "Spotlight de origen único",
    body: "Vitrina editorial: imagen, productor, notas y producto vinculado.",
    cta: "Editar spotlight",
  },
  {
    key: "featured",
    icon: ImageIcon,
    title: "Paquete destacado",
    body: "Producto o paquete con CTA en la home y catálogo.",
    cta: "Editar destacado",
  },
  {
    key: "blog",
    icon: BookOpen,
    title: "Blog",
    body: "6 artículos publicados · 1 en borrador.",
    cta: "Gestionar artículos",
  },
  {
    key: "guides",
    icon: BookOpen,
    title: "Guías de preparación",
    body: "5 métodos publicados (V60, prensa, AeroPress, espresso, cold brew).",
    cta: "Gestionar guías",
  },
  {
    key: "stores",
    icon: MapPin,
    title: "Tiendas físicas",
    body: "3 ubicaciones en Bogotá.",
    cta: "Gestionar tiendas",
  },
];

export default function AdminContentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Contenido del sitio"
        description="Edita lo que se ve en la tienda pública."
      />

      <section className="rounded-lg border border-border bg-background p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Hero activo</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Campaña de otoño · vigente 15 sep – 15 nov 2026
            </p>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
            Activo
          </Badge>
        </div>
        <div className="grid sm:grid-cols-[280px_1fr] gap-5">
          <div className="aspect-[5/4] rounded-md bg-muted grid place-items-center text-xs text-muted-foreground">
            Imagen hero
          </div>
          <div className="space-y-3">
            <Field label="Eyebrow" value="Campaña de otoño" />
            <Field label="Titular" value="El otoño sabe a café recién tostado" />
            <Field label="Subtítulo" value="Mezclas y orígenes únicos, tostados en lotes pequeños." />
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Texto CTA" value="Comprar la mezcla" />
              <Field label="Enlace CTA" value="/p/mezcla-del-alba" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Inicio" value="15 sep 2026" icon={<Calendar className="size-3.5" />} />
              <Field label="Fin" value="15 nov 2026" icon={<Calendar className="size-3.5" />} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline">Vista previa</Button>
              <Button>Guardar cambios</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PANELS.map((p) => {
          const Icon = p.icon;
          return (
            <article
              key={p.key}
              className="rounded-lg border border-border bg-background p-5 hover:border-foreground/30 transition-colors"
            >
              <span className="size-9 rounded-md bg-muted grid place-items-center mb-3">
                <Icon className="size-4" />
              </span>
              <h3 className="font-display text-lg font-semibold tracking-tight">{p.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.body}</p>
              <Button variant="outline" size="sm" className="mt-4">
                {p.cta}
              </Button>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function Field({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
        {label}
      </span>
      <div className="relative">
        {icon && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}
        <input
          defaultValue={value}
          className={
            "w-full rounded-md border border-input bg-background py-2 text-sm outline-none focus-visible:border-foreground/40 " +
            (icon ? "pl-8 pr-3" : "px-3")
          }
        />
      </div>
    </label>
  );
}
