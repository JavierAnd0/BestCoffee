"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const TYPE_FILTERS = [
  { value: "BLEND", label: "Mezcla" },
  { value: "SINGLE_ORIGIN", label: "Origen único" },
  { value: "DECAF", label: "Descafeinado" },
];

const FORMATS = ["Grano entero", "Molido espresso", "Molido filtro", "Molido prensa"];

const AVAILABILITY = ["Exclusivo suscriptores", "Edición limitada", "Más vendidos"];

interface Props {
  allNotes: string[];
}

export function CatalogFilters({ allNotes }: Props) {
  return (
    <>
      <aside className="hidden lg:block sticky top-24 self-start space-y-8">
        <FilterBody allNotes={allNotes} />
      </aside>

      <MobileFilters allNotes={allNotes} />
    </>
  );
}

function MobileFilters({ allNotes }: { allNotes: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="lg:hidden sticky top-[57px] z-20 -mx-4 sm:-mx-6 bg-background/95 backdrop-blur border-b border-border py-2 px-4 sm:px-6 flex items-center justify-between gap-2 mb-6">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Filter className="size-3.5" />
          Filtros
        </Button>
        <select
          className="rounded-md border border-input bg-background px-3 h-8 text-xs outline-none focus-visible:border-foreground/40"
          aria-label="Ordenar"
        >
          <option>Destacados</option>
          <option>Más vendidos</option>
          <option>Precio: bajo a alto</option>
          <option>Precio: alto a bajo</option>
          <option>Más nuevos</option>
        </select>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-full sm:max-w-sm p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b border-border flex flex-row items-center justify-between">
            <SheetTitle className="font-display text-xl">Filtros</SheetTitle>
            <SheetDescription className="sr-only">
              Filtra el catálogo por tipo, tueste, notas y formato.
            </SheetDescription>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
            <FilterBody allNotes={allNotes} />
          </div>
          <div className="border-t border-border px-5 py-4 flex gap-2">
            <Button variant="outline" className="flex-1">
              Limpiar
            </Button>
            <Button className="flex-1" onClick={() => setOpen(false)}>
              Ver resultados
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function FilterBody({ allNotes }: { allNotes: string[] }) {
  return (
    <>
      <FacetGroup title="Tipo de café">
        <div className="space-y-2">
          {TYPE_FILTERS.map((f) => (
            <Check key={f.value} label={f.label} />
          ))}
        </div>
      </FacetGroup>

      <FacetGroup title="Nivel de tostado">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Claro</span>
          <div className="flex flex-1 items-center gap-[3px]">
            {Array.from({ length: 9 }).map((_, i) => (
              <span
                key={i}
                className={
                  "h-2 flex-1 rounded-[1px] border border-foreground/20 " +
                  (i >= 2 && i <= 6 ? "bg-foreground/70" : "")
                }
              />
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground">Oscuro</span>
        </div>
      </FacetGroup>

      <FacetGroup title="Notas de sabor">
        <div className="flex flex-wrap gap-1.5">
          {allNotes.map((n, i) => (
            <Badge
              key={n}
              variant={i < 2 ? "secondary" : "outline"}
              className="font-normal cursor-pointer hover:bg-muted"
            >
              {n}
            </Badge>
          ))}
        </div>
      </FacetGroup>

      <FacetGroup title="Formato">
        <div className="space-y-2">
          {FORMATS.map((g) => (
            <Check key={g} label={g} />
          ))}
        </div>
      </FacetGroup>

      <FacetGroup title="Disponibilidad">
        <div className="space-y-2">
          {AVAILABILITY.map((g) => (
            <Check key={g} label={g} />
          ))}
        </div>
      </FacetGroup>
    </>
  );
}

function FacetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground mb-3">
        {title}
      </div>
      {children}
    </div>
  );
}

function Check({ label }: { label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" className="size-4 accent-foreground" />
      <span>{label}</span>
    </label>
  );
}
