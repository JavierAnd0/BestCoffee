"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export interface CatalogFacetCounts {
  total: number;
  byType: Record<string, number>;
  byRoast: { light: number; medium: number; dark: number };
  byFormat: Record<string, number>;
  byAvailability: Record<string, number>;
}

interface Props {
  coffeeNotes: string[];
  accessorySpecs: string[];
  counts: CatalogFacetCounts;
  activeCategory: string;
}

const TYPE_FILTERS = [
  { value: "SINGLE_ORIGIN", label: "Origen único" },
  { value: "BLEND", label: "Mezcla de autor" },
  { value: "DECAF", label: "Descafeinado" },
  { value: "ACCESSORY", label: "Accesorios y Barismo" },
];

const ROAST_RANGES = [
  { key: "light", label: "Tueste claro", code: "1–3" },
  { key: "medium", label: "Tueste medio", code: "4–6" },
  { key: "dark", label: "Tueste oscuro", code: "7–9" },
] as const;

const FORMAT_FILTERS = [
  { value: "WHOLE_BEAN", label: "Grano entero" },
  { value: "ESPRESSO", label: "Molido espresso" },
  { value: "FILTER", label: "Molido filtro" },
  { value: "FRENCH_PRESS", label: "Molido prensa" },
];

const AVAILABILITY_FILTERS = [
  { value: "bestseller", label: "Más vendidos" },
  { value: "limited", label: "Edición limitada" },
  { value: "subscriber", label: "Exclusivo suscriptores" },
];

interface SensoryFamily {
  title: string;
  keywords: RegExp;
}

const SENSORY_FAMILIES: SensoryFamily[] = [
  {
    title: "Cacao, Caramelo & Dulces",
    keywords: /cacao|chocolate|caramelo|panela|miel|melaza|vainilla|dulce/i,
  },
  {
    title: "Frutales & Cítricos",
    keywords: /cereza|citrico|cítrico|durazno|fruta|fruto|limon|mandarina|manzana|mora|naranja/i,
  },
  {
    title: "Florales, Té & Especias",
    keywords: /flor|jazmin|jazmín|te |té |tabaco|especia|rosa|bergamota/i,
  },
  {
    title: "Nueces & Tostados",
    keywords: /almendra|avellana|nuez|mani|maní|malta/i,
  },
];

function groupCoffeeNotes(notes: string[]): Array<{ title: string; items: string[] }> {
  const assigned = new Set<string>();
  const groups: Array<{ title: string; items: string[] }> = [];

  for (const fam of SENSORY_FAMILIES) {
    const matched = notes.filter((n) => !assigned.has(n) && fam.keywords.test(n));
    if (matched.length > 0) {
      matched.forEach((n) => assigned.add(n));
      groups.push({ title: fam.title, items: matched });
    }
  }

  const remaining = notes.filter((n) => !assigned.has(n));
  if (remaining.length > 0) {
    groups.push({ title: "Otras notas de cata", items: remaining });
  }

  return groups;
}

function padCount(n: number): string {
  return String(n ?? 0).padStart(2, "0");
}

export function CatalogFilters({
  coffeeNotes,
  accessorySpecs,
  counts,
  activeCategory,
}: Props) {
  return (
    <>
      <aside className="hidden lg:block sticky top-24 self-start space-y-7">
        <FilterBody
          coffeeNotes={coffeeNotes}
          accessorySpecs={accessorySpecs}
          counts={counts}
          activeCategory={activeCategory}
        />
      </aside>

      <MobileFilters
        coffeeNotes={coffeeNotes}
        accessorySpecs={accessorySpecs}
        counts={counts}
        activeCategory={activeCategory}
      />
    </>
  );
}

function MobileFilters(props: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("orden") ?? "destacados";

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "destacados") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("pagina");
    const qs = params.toString();
    router.push(qs ? `/catalogo?${qs}` : "/catalogo");
  };

  return (
    <>
      <div className="lg:hidden sticky top-[57px] z-20 -mx-4 sm:-mx-6 bg-background/95 backdrop-blur border-b border-border py-2.5 px-4 sm:px-6 flex items-center justify-between gap-2 mb-6">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Filter className="size-3.5 mr-1.5" />
          Filtrar catálogo
        </Button>
        <select
          value={currentSort}
          onChange={(e) => updateParam("orden", e.target.value)}
          className="rounded-md border border-input bg-background px-3 h-8 text-xs outline-none focus-visible:border-foreground/40"
          aria-label="Ordenar"
        >
          <option value="destacados">Destacados</option>
          <option value="precio-asc">Precio: menor a mayor</option>
          <option value="precio-desc">Precio: mayor a menor</option>
          <option value="tueste-asc">Tueste: suave a intenso</option>
        </select>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-full sm:max-w-sm p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b border-border flex flex-row items-center justify-between">
            <SheetTitle className="font-display text-xl">Filtros</SheetTitle>
            <SheetDescription className="sr-only">
              Filtra el catálogo por tipo, tueste, notas sensoriales y formato.
            </SheetDescription>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-7">
            <FilterBody {...props} />
          </div>
          <div className="border-t border-border px-5 py-4 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                router.push("/catalogo");
                setOpen(false);
              }}
            >
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

function FilterBody({
  coffeeNotes,
  accessorySpecs,
  counts,
  activeCategory,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedType = searchParams.get("tipo") ?? "";
  const selectedRoast = searchParams.get("tueste") ?? "";
  const selectedNote = searchParams.get("nota") ?? "";
  const selectedFormat = searchParams.get("formato") ?? "";
  const selectedAvail = searchParams.get("disponibilidad") ?? "";
  const searchQuery = searchParams.get("q") ?? "";

  const hasActiveFilters = Boolean(
    selectedType ||
      selectedRoast ||
      selectedNote ||
      selectedFormat ||
      selectedAvail ||
      searchQuery,
  );

  const toggleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("pagina");
    const qs = params.toString();
    router.push(qs ? `/catalogo?${qs}` : "/catalogo", { scroll: false });
  };

  const resetAll = () => {
    const params = new URLSearchParams();
    const cat = searchParams.get("categoria");
    if (cat) params.set("categoria", cat);
    const qs = params.toString();
    router.push(qs ? `/catalogo?${qs}` : "/catalogo", { scroll: false });
  };

  const groupedNotes = groupCoffeeNotes(coffeeNotes);
  const showCoffeeFacets = activeCategory !== "accesorios";
  const showAccessoryFacets =
    activeCategory === "accesorios" ||
    (activeCategory === "todo" && selectedType === "ACCESSORY");

  return (
    <>
      {hasActiveFilters && (
        <div className="pb-4 border-b border-border flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Filtros activos
          </span>
          <button
            type="button"
            onClick={resetAll}
            className="editorial-select-row inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border border-foreground/30 cursor-pointer"
          >
            <RotateCcw className="size-3" />
            <span>Limpiar todo</span>
          </button>
        </div>
      )}

      {/* 1. Tipo de producto (The Smashing Machine block style) */}
      <FacetGroup title="Categoría de lote">
        <div className="divide-y divide-border border-y border-border">
          {TYPE_FILTERS.map((f) => {
            const active = selectedType === f.value;
            const count = counts.byType[f.value] ?? 0;
            return (
              <button
                key={f.value}
                type="button"
                data-active={active}
                onClick={() => toggleFilter("tipo", f.value)}
                className="editorial-select-row w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium text-left cursor-pointer"
              >
                <span>{f.label}</span>
                <span className="tabular-nums opacity-75">{padCount(count)}</span>
              </button>
            );
          })}
        </div>
      </FacetGroup>

      {/* 2. Nivel de tostado interactivo */}
      {showCoffeeFacets && (
        <FacetGroup title="Nivel de tostado">
          <div className="divide-y divide-border border-y border-border">
            {ROAST_RANGES.map((r) => {
              const active = selectedRoast === r.key;
              const count = counts.byRoast[r.key] ?? 0;
              return (
                <button
                  key={r.key}
                  type="button"
                  data-active={active}
                  onClick={() => toggleFilter("tueste", r.key)}
                  className="editorial-select-row w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium text-left cursor-pointer"
                >
                  <span>
                    {r.label}{" "}
                    <span className="opacity-60 font-normal">({r.code})</span>
                  </span>
                  <span className="tabular-nums opacity-75">{padCount(count)}</span>
                </button>
              );
            })}
          </div>
        </FacetGroup>
      )}

      {/* 3. Notas de sabor organizadas por familia sensorial */}
      {showCoffeeFacets && groupedNotes.length > 0 && (
        <FacetGroup title="Notas de sabor">
          <div className="space-y-4">
            {groupedNotes.map((group) => (
              <div key={group.title}>
                <div className="text-[11px] font-medium text-muted-foreground mb-1.5">
                  {group.title}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((note) => {
                    const active =
                      selectedNote.toLowerCase() === note.toLowerCase();
                    return (
                      <button
                        key={note}
                        type="button"
                        data-active={active}
                        onClick={() => toggleFilter("nota", note)}
                        className="editorial-select-row border border-border px-2.5 py-1 text-xs capitalize cursor-pointer"
                      >
                        <span>{note}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </FacetGroup>
      )}

      {/* Atributos de accesorios separados limpiamente */}
      {showAccessoryFacets && accessorySpecs.length > 0 && (
        <FacetGroup title="Atributos de equipo">
          <div className="flex flex-wrap gap-1.5">
            {accessorySpecs.map((spec) => {
              const active = selectedNote.toLowerCase() === spec.toLowerCase();
              return (
                <button
                  key={spec}
                  type="button"
                  data-active={active}
                  onClick={() => toggleFilter("nota", spec)}
                  className="editorial-select-row border border-border px-2.5 py-1 text-xs cursor-pointer"
                >
                  <span>{spec}</span>
                </button>
              );
            })}
          </div>
        </FacetGroup>
      )}

      {/* 4. Formato de molienda */}
      {showCoffeeFacets && (
        <FacetGroup title="Formato">
          <div className="divide-y divide-border border-y border-border">
            {FORMAT_FILTERS.map((f) => {
              const active = selectedFormat === f.value;
              const count = counts.byFormat[f.value] ?? 0;
              return (
                <button
                  key={f.value}
                  type="button"
                  data-active={active}
                  onClick={() => toggleFilter("formato", f.value)}
                  className="editorial-select-row w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium text-left cursor-pointer"
                >
                  <span>{f.label}</span>
                  <span className="tabular-nums opacity-75">{padCount(count)}</span>
                </button>
              );
            })}
          </div>
        </FacetGroup>
      )}

      {/* 5. Disponibilidad */}
      <FacetGroup title="Disponibilidad">
        <div className="divide-y divide-border border-y border-border">
          {AVAILABILITY_FILTERS.map((a) => {
            const active = selectedAvail === a.value;
            const count = counts.byAvailability[a.value] ?? 0;
            return (
              <button
                key={a.value}
                type="button"
                data-active={active}
                onClick={() => toggleFilter("disponibilidad", a.value)}
                className="editorial-select-row w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium text-left cursor-pointer"
              >
                <span>{a.label}</span>
                <span className="tabular-nums opacity-75">{padCount(count)}</span>
              </button>
            );
          })}
        </div>
      </FacetGroup>
    </>
  );
}

function FacetGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground mb-2.5">
        {title}
      </div>
      {children}
    </div>
  );
}
