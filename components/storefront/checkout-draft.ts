// Borrador del checkout guardado en el navegador: si el comprador sale de la
// página (o vuelve de MercadoPago sin pagar), lo retoma donde lo dejó.
//
// Es una comodidad por navegador, no un dato de la tienda: se guarda por
// tienda y por cliente, caduca a los 7 días y se borra al confirmar el pedido.
// Nunca guarda datos de pago (el pago ocurre en MercadoPago).

export interface DraftContact {
  email: string;
  phone: string;
}

export interface DraftShipping {
  firstName: string;
  lastName: string;
  address: string;
  line2: string;
  city: string;
  region: string;
  zip: string;
}

export interface CheckoutDraft {
  step: 1 | 2 | 3;
  contact: DraftContact;
  shipping: DraftShipping;
  selectedAddressId: string;
  discountCode: string | null;
}

interface StoredDraft extends CheckoutDraft {
  v: 1;
  savedAt: number;
  /** Correo del cliente con sesión, o null para un invitado. */
  owner: string | null;
}

const PREFIX = "bestcoffee:checkout:v1";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function key(tenantSlug: string | null): string {
  return tenantSlug ? `${PREFIX}:${tenantSlug}` : PREFIX;
}

function str(v: unknown): string {
  return typeof v === "string" ? v.slice(0, 300) : "";
}

function normOwner(email?: string | null): string | null {
  return email ? email.trim().toLowerCase() : null;
}

/** Borrador vigente de esta tienda y este cliente, o null. */
export function loadCheckoutDraft(
  tenantSlug: string | null,
  ownerEmail?: string | null,
): CheckoutDraft | null {
  try {
    const raw = localStorage.getItem(key(tenantSlug));
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<StoredDraft>;
    if (d.v !== 1 || typeof d.savedAt !== "number") return null;
    if (Date.now() - d.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(key(tenantSlug));
      return null;
    }
    // Un borrador de otra persona (otra sesión, o invitado vs. cuenta) no se
    // muestra: tendría su correo y su dirección.
    if ((d.owner ?? null) !== normOwner(ownerEmail)) return null;
    if (!d.contact || !d.shipping) return null;
    // Lo guardado se lee como dato no confiable: solo textos, nada más.
    const c = d.contact as unknown as Record<string, unknown>;
    const sh = d.shipping as unknown as Record<string, unknown>;
    return {
      step: d.step === 2 || d.step === 3 ? d.step : 1,
      contact: { email: str(c.email), phone: str(c.phone) },
      shipping: {
        firstName: str(sh.firstName),
        lastName: str(sh.lastName),
        address: str(sh.address),
        line2: str(sh.line2),
        city: str(sh.city),
        region: str(sh.region),
        zip: str(sh.zip),
      },
      selectedAddressId:
        typeof d.selectedAddressId === "string" ? d.selectedAddressId : "custom",
      discountCode: typeof d.discountCode === "string" ? d.discountCode : null,
    };
  } catch {
    return null;
  }
}

export function saveCheckoutDraft(
  tenantSlug: string | null,
  ownerEmail: string | null | undefined,
  draft: CheckoutDraft,
): void {
  try {
    const stored: StoredDraft = {
      ...draft,
      v: 1,
      savedAt: Date.now(),
      owner: normOwner(ownerEmail),
    };
    localStorage.setItem(key(tenantSlug), JSON.stringify(stored));
  } catch {}
}

export function clearCheckoutDraft(tenantSlug: string | null): void {
  try {
    localStorage.removeItem(key(tenantSlug));
  } catch {}
}

/** Mensaje de error del paso de contacto, o null si está completo. */
export function contactProblem(c: DraftContact): string | null {
  if (!c.email.trim() || !c.email.includes("@")) {
    return "Por favor ingresa un correo electrónico válido.";
  }
  if (!c.phone.trim() || c.phone.trim().length < 7) {
    return "Por favor ingresa un número de teléfono de contacto (mínimo 7 dígitos).";
  }
  return null;
}

/** Mensaje de error del paso de dirección, o null si está completo. */
export function shippingProblem(s: DraftShipping): string | null {
  if (!s.firstName.trim()) return "Por favor ingresa el nombre de quien recibe.";
  if (!s.lastName.trim()) return "Por favor ingresa el apellido de quien recibe.";
  if (!s.address.trim() || s.address.trim().length < 3) {
    return "Por favor ingresa la dirección de entrega.";
  }
  if (!s.line2.trim()) {
    return "Por favor indica apartamento, interior, edificio o casa.";
  }
  if (!s.region.trim()) return "Por favor selecciona el departamento de entrega.";
  if (!s.city.trim() || s.city.trim().length < 2) {
    return "Por favor selecciona o especifica la ciudad.";
  }
  if (!/^\d{6}$/.test(s.zip.trim())) {
    return "Por favor ingresa el código postal (6 dígitos).";
  }
  return null;
}
