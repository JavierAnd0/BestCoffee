/**
 * Lógica y textos del panel "Arma tu tienda" de la demo. Es puro (sin React ni
 * next/headers) para que el panel lo importe sin arrastrar código de servidor.
 *
 * Los nombres "Presencia" y "Tienda" describen lo que cubre cada nivel; el nombre
 * comercial definitivo de los planes sigue sin decidirse (ver PRODUCT.md).
 */

export type DemoKey =
  | "catalog"
  | "accessories"
  | "blog"
  | "checkout"
  | "customerAccounts"
  | "subscriptions"
  | "discountCodes"
  | "reviews";

export type DemoState = Record<DemoKey, boolean>;

export interface DemoFeature {
  key: DemoKey;
  label: string;
  help: string;
  /** Lo que necesita para tener sentido; se muestra fijo bajo la función. */
  needs?: DemoKey;
  /** Dónde se nota en el sitio, para avisarlo al encender o apagar la función. */
  where: string;
  /** Página donde se ve la función al encenderla ("Ver el sitio"). */
  see: string;
}

export interface DemoGroup {
  id: "presence" | "store";
  title: string;
  features: DemoFeature[];
}

export const DEMO_GROUPS: DemoGroup[] = [
  {
    id: "presence",
    title: "Presencia",
    features: [
      { key: "catalog", label: "Catálogo", help: "Productos y precios", where: "el menú Catálogo y la portada", see: "/catalogo" },
      { key: "accessories", label: "Accesorios", help: "Molinos, teteras y más", needs: "catalog", where: "el menú Accesorios", see: "/accesorios" },
      { key: "blog", label: "Blog", help: "Artículos y guías", where: "el menú Aprende y el blog", see: "/blog" },
    ],
  },
  {
    id: "store",
    title: "Tienda",
    features: [
      {
        key: "checkout",
        label: "Pedidos",
        help: "Pedidos con cobro por transferencia o contra entrega",
        needs: "catalog",
        where: "el carrito y el pago",
        see: "/catalogo",
      },
      {
        key: "customerAccounts",
        label: "Cuentas de cliente",
        help: "Registro e historial de pedidos",
        needs: "checkout",
        where: "el ícono de cuenta",
        see: "/cuenta",
      },
      { key: "subscriptions", label: "Suscripciones", help: "Entregas recurrentes", needs: "checkout", where: "el menú Suscripciones", see: "/suscripciones" },
      { key: "discountCodes", label: "Cupones", help: "Códigos de descuento", needs: "checkout", where: "el carrito y el pago", see: "/catalogo" },
      { key: "reviews", label: "Reseñas", help: "Opiniones de tus clientes", needs: "catalog", where: "las fichas de producto", see: "/catalogo" },
    ],
  },
];

export const DEMO_FEATURES: DemoFeature[] = DEMO_GROUPS.flatMap((g) => g.features);

export const FEATURE_LABEL = Object.fromEntries(
  DEMO_FEATURES.map((f) => [f.key, f.label]),
) as Record<DemoKey, string>;

export const ALL_OFF: DemoState = {
  catalog: false,
  accessories: false,
  blog: false,
  checkout: false,
  customerAccounts: false,
  subscriptions: false,
  discountCodes: false,
  reviews: false,
};

export const ALL_ON: DemoState = {
  catalog: true,
  accessories: true,
  blog: true,
  checkout: true,
  customerAccounts: true,
  subscriptions: true,
  discountCodes: true,
  reviews: true,
};

export interface DemoPreset {
  id: string;
  label: string;
  help: string;
  state: DemoState;
}

export const DEMO_PRESETS: DemoPreset[] = [
  { id: "landing", label: "Solo landing", help: "Tu marca en línea", state: ALL_OFF },
  {
    id: "catalog",
    label: "Mi vitrina",
    help: "Productos y blog, sin compra",
    state: { ...ALL_OFF, catalog: true, accessories: true, blog: true },
  },
  {
    id: "orders",
    label: "Vendo en línea",
    help: "Recibes pedidos de clientes",
    state: {
      ...ALL_OFF,
      catalog: true,
      accessories: true,
      blog: true,
      checkout: true,
      customerAccounts: true,
    },
  },
  { id: "full", label: "Todo lo de la demo", help: "Sin pagos en línea ni regalos", state: ALL_ON },
];

/** El preset que coincide exacto con el estado actual, si hay alguno. */
export function matchPreset(state: DemoState): string | null {
  const hit = DEMO_PRESETS.find((p) => DEMO_FEATURES.every((f) => p.state[f.key] === state[f.key]));
  return hit?.id ?? null;
}

/**
 * Cada función depende de otra para tener sentido (sin catálogo no hay qué
 * pedir; sin pedidos no hay dónde aplicar un cupón ni a quién darle cuenta).
 * Las dependencias se arrastran de forma transitiva.
 */
const NEEDS: Partial<Record<DemoKey, DemoKey>> = Object.fromEntries(
  DEMO_FEATURES.filter((f) => f.needs).map((f) => [f.key, f.needs]),
);

export interface ToggleResult {
  state: DemoState;
  /** Funciones que cambiaron además de la tocada (para avisarlo). */
  also: DemoKey[];
}

/** Enciende o apaga una función y arrastra las que dependen de ella. */
export function toggleFeature(state: DemoState, key: DemoKey, on: boolean): ToggleResult {
  const next = { ...state, [key]: on };
  const also: DemoKey[] = [];

  if (on) {
    for (let need = NEEDS[key]; need && !next[need]; need = NEEDS[need]) {
      next[need] = true;
      also.push(need);
    }
  } else {
    // Apagar una función apaga todo lo que la necesita; se repite hasta que
    // no cambie nada (cuentas dependen de pedidos, que dependen del catálogo).
    let changed = true;
    while (changed) {
      changed = false;
      for (const f of DEMO_FEATURES) {
        const need = NEEDS[f.key];
        if (next[f.key] && need && !next[need]) {
          next[f.key] = false;
          also.push(f.key);
          changed = true;
        }
      }
    }
  }
  return { state: next, also };
}

const list = new Intl.ListFormat("es-CO", { style: "long", type: "conjunction" });

/** Aviso de una línea cuando un cambio arrastró otras funciones. */
export function dependencyNote(key: DemoKey, on: boolean, also: DemoKey[]): string | null {
  if (also.length === 0) return null;
  const names = list.format(also.map((k) => FEATURE_LABEL[k]));
  return on
    ? `Para usar ${FEATURE_LABEL[key]} encendimos también ${names}.`
    : `Al apagar ${FEATURE_LABEL[key]} apagamos también ${names}.`;
}

const WHERE: Record<DemoKey, string> = Object.fromEntries(
  DEMO_FEATURES.map((f) => [f.key, f.where]),
) as Record<DemoKey, string>;

/**
 * Aviso del cambio recién hecho: qué pasó (con las funciones arrastradas, si las
 * hubo) y dónde se nota en el sitio, para que el visitante sepa qué mirar.
 */
export function changeNote(key: DemoKey, on: boolean, also: DemoKey[]): string {
  const what = dependencyNote(key, on, also) ?? `${FEATURE_LABEL[key]} ${on ? "encendido" : "apagado"}.`;
  // Con varias funciones arrastradas la lista ya lo dice todo: nombrar además
  // los lugares sería un muro de texto.
  if (also.length > 1) return what;
  const places = list.format([...new Set([key, ...also].map((k) => WHERE[k]))]);
  return `${what} ${on ? "Se nota en" : "Deja de verse en"} ${places}.`;
}

/** A dónde lleva "Ver el sitio": a la página de la función al encenderla; al inicio al apagarla. */
export function seeHref(key: DemoKey, on: boolean): string {
  return on ? (DEMO_FEATURES.find((f) => f.key === key)?.see ?? "/") : "/";
}

export type PlanLevel = "landing" | "presence" | "store";

export interface PlanSummary {
  level: PlanLevel;
  title: string;
  detail: string;
  on: number;
  total: number;
}

/** Qué nivel cubre lo que el visitante tiene encendido. */
export function summarize(state: DemoState): PlanSummary {
  const on = DEMO_FEATURES.filter((f) => state[f.key]).length;
  const total = DEMO_FEATURES.length;
  // "Tienda" solo si los clientes pueden pedir: cuentas, cupones y demás dependen de eso.
  if (state.checkout) {
    return {
      level: "store",
      title: "Plan Tienda",
      detail: "Tus clientes piden en línea y tú gestionas los pedidos.",
      on,
      total,
    };
  }
  if (on > 0) {
    return {
      level: "presence",
      title: "Plan Presencia",
      detail: state.catalog
        ? "Muestras tu café y tu contenido; los clientes no piden en línea."
        : "Publicas tu blog y tu contacto; aún no muestras productos.",
      on,
      total,
    };
  }
  return {
    level: "landing",
    title: "Plan Landing",
    detail: "Una página con tu marca y tu contacto, sin funciones extra.",
    on,
    total,
  };
}

/** Correo de contacto válido o null: sin dirección real el botón no se muestra. */
export function validContact(email: string | null | undefined): string | null {
  const value = (email ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
}

/** Enlace mailto con el resumen de lo que el visitante armó, ya redactado. */
export function contactHref(email: string, state: DemoState): string {
  const summary = summarize(state);
  const on = DEMO_FEATURES.filter((f) => state[f.key]).map((f) => f.label);
  const body = [
    "Hola, armé mi tienda en la demo de Bestkofi y quiero hablar de ella.",
    "",
    `Lo que armé: ${summary.title}.`,
    `Encendido: ${on.length ? list.format(on) : "ninguna función extra"}.`,
    "",
    "Mi café:",
    "Mi ciudad:",
  ].join("\r\n");
  return `mailto:${email}?subject=${encodeURIComponent("Quiero mi tienda en Bestkofi")}&body=${encodeURIComponent(body)}`;
}
