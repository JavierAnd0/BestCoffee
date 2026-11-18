"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { COLOMBIA_DEPARTMENTS } from "@/lib/data/colombia";

const OTHER = "__otro__";
const WHOLE_DEPT = "";

type Parsed =
  | { mode: "colombia"; department: string; city: string }
  | { mode: "custom"; text: string };

/** Sin tildes ni mayúsculas, para comparar "Nariño" con "narino". */
function clean(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function findDepartment(name: string) {
  const c = clean(name);
  if (c === "bogota" || c === "bogota d.c.") return COLOMBIA_DEPARTMENTS[0];
  return COLOMBIA_DEPARTMENTS.find((d) => clean(d.name) === c);
}

/**
 * Lee el origen guardado. Entiende "Huila, Colombia" y "Pitalito, Huila,
 * Colombia"; cualquier otra cosa (café importado, altitudes, varias regiones)
 * se respeta como texto libre para no perder lo que ya estaba escrito.
 */
function parse(value: string): Parsed {
  const v = value.trim();
  if (!v) return { mode: "colombia", department: "", city: "" };

  const parts = v.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1 && clean(parts[parts.length - 1]) === "colombia") parts.pop();

  if (parts.length === 1) {
    const dept = findDepartment(parts[0]);
    if (dept) return { mode: "colombia", department: dept.name, city: "" };
  }
  if (parts.length === 2) {
    const dept = findDepartment(parts[1]);
    const city = dept?.cities.find((c) => clean(c) === clean(parts[0]));
    if (dept && city) return { mode: "colombia", department: dept.name, city };
  }
  return { mode: "custom", text: v };
}

function format(department: string, city: string) {
  if (!department) return "";
  // Bogotá es a la vez departamento y ciudad: no repetirlo.
  if (!city || city === department) return `${department}, Colombia`;
  return `${city}, ${department}, Colombia`;
}

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-60";
const selectClass = `${fieldClass} appearance-none pr-8`;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
      {children}
    </span>
  );
}

function Select({
  value,
  onChange,
  disabled,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

/**
 * Origen del café: primero el departamento y, a partir de él, el municipio.
 * Guarda un único texto ("Pitalito, Huila, Colombia") porque así lo espera el
 * producto, y deja escribir a mano el origen de cafés de fuera de Colombia.
 */
export function OriginPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  // Se lee una sola vez: a partir de aquí el estado local manda, para que
  // elegir un departamento sin municipio no "salte" a otro modo al reescribir.
  const [initial] = useState(() => parse(value));
  const [custom, setCustom] = useState(initial.mode === "custom");
  const [department, setDepartment] = useState(
    initial.mode === "colombia" ? initial.department : "",
  );
  const [city, setCity] = useState(initial.mode === "colombia" ? initial.city : "");

  const cities = COLOMBIA_DEPARTMENTS.find((d) => d.name === department)?.cities ?? [];
  const singleCity = cities.length === 1;

  function pickDepartment(next: string) {
    if (next === OTHER) {
      setCustom(true);
      // Lo elegido sirve de punto de partida para escribir.
      return;
    }
    setDepartment(next);
    setCity(WHOLE_DEPT);
    onChange(format(next, WHOLE_DEPT));
  }

  function pickCity(next: string) {
    setCity(next);
    onChange(format(department, next));
  }

  if (custom) {
    return (
      <div className="space-y-1.5">
        <label className="block">
          <FieldLabel>País / región</FieldLabel>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Guji, Etiopía"
            autoFocus={initial.mode !== "custom"}
            className={fieldClass}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            const p = parse(value);
            const dept = p.mode === "colombia" ? p.department : "";
            const c = p.mode === "colombia" ? p.city : "";
            setDepartment(dept);
            setCity(c);
            setCustom(false);
            onChange(format(dept, c));
          }}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Elegir departamento y municipio de Colombia
        </button>
      </div>
    );
  }

  return (
    <>
      <label className="block">
        <FieldLabel>Departamento</FieldLabel>
        <Select value={department} onChange={pickDepartment}>
          <option value="" disabled>
            Elige un departamento
          </option>
          {COLOMBIA_DEPARTMENTS.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
          <option value={OTHER}>Otro país o texto libre…</option>
        </Select>
      </label>

      <label className="block">
        <FieldLabel>Municipio</FieldLabel>
        <Select
          value={singleCity ? WHOLE_DEPT : city}
          onChange={pickCity}
          disabled={!department || singleCity}
        >
          <option value={WHOLE_DEPT}>
            {!department
              ? "Primero el departamento"
              : singleCity
                ? cities[0]
                : "Todo el departamento"}
          </option>
          {!singleCity &&
            cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
        </Select>
      </label>

      <p className="self-end pb-2.5 text-xs leading-snug text-muted-foreground">
        {department ? (
          <>
            En la tienda se verá como{" "}
            <span className="font-medium text-foreground">{format(department, city)}</span>
          </>
        ) : (
          "¿Café de otro país? Elige «Otro país o texto libre» en la lista."
        )}
      </p>
    </>
  );
}
