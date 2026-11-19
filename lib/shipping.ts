/**
 * Tipos y textos de las guías de envío (Envia.com), compartidos entre el
 * panel y la cuenta del cliente. Sin dependencias de servidor.
 */

export type ShipmentStatus =
  | "LABEL_CREATED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "EXCEPTION"
  | "CANCELLED";

export interface AdminShipment {
  id: string;
  carrier: string;
  service: string;
  trackingNumber: string;
  labelUrl: string | null;
  trackingUrl: string | null;
  costCents: number;
  status: ShipmentStatus;
  statusDetail: string | null;
  lastEventAt: string | null;
  createdAt: string;
}

/** Lo que ve el cliente de su guía (sin costo ni etiqueta). */
export interface CustomerShipment {
  carrier: string;
  trackingNumber: string;
  trackingUrl: string | null;
  status: ShipmentStatus;
  statusDetail: string | null;
  lastEventAt: string | null;
  deliveredAt: string | null;
}

export function mapCustomerShipment(raw: unknown): CustomerShipment | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.trackingNumber !== "string" || !r.trackingNumber) return null;
  return {
    carrier: String(r.carrier ?? ""),
    trackingNumber: r.trackingNumber,
    trackingUrl: safeHttpUrl(r.trackingUrl),
    status: toShipmentStatus(r.status),
    statusDetail: typeof r.statusDetail === "string" ? r.statusDetail : null,
    lastEventAt: typeof r.lastEventAt === "string" ? r.lastEventAt : null,
    deliveredAt: typeof r.deliveredAt === "string" ? r.deliveredAt : null,
  };
}

export interface ShippingRate {
  carrier: string;
  service: string;
  serviceDescription: string;
  deliveryEstimate: string | null;
  totalCents: number;
}

export interface ShippingQuote {
  rates: ShippingRate[];
  package: { weightKg: number; lengthCm: number; widthCm: number; heightCm: number };
  destination: { cityCode: string; stateCode: string };
  test: boolean;
}

export interface ShipmentOverrides {
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  destinationCityCode?: string;
  destinationStateCode?: string;
}

export const SHIPMENT_STATUS_LABEL: Record<ShipmentStatus, string> = {
  LABEL_CREATED: "Guía generada",
  IN_TRANSIT: "En camino",
  DELIVERED: "Entregado",
  EXCEPTION: "Novedad en el envío",
  CANCELLED: "Guía anulada",
};

export const SHIPMENT_STATUS_TONE: Record<ShipmentStatus, string> = {
  LABEL_CREATED: "bg-muted text-foreground border-border",
  IN_TRANSIT: "bg-sky-500/10 text-sky-700 border-sky-500/20",
  DELIVERED: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  EXCEPTION: "bg-amber-500/10 text-amber-800 border-amber-500/20",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

const CARRIER_NAMES: Record<string, string> = {
  coordinadora: "Coordinadora",
  servientrega: "Servientrega",
  interrapidisimo: "Interrapidísimo",
  tcc: "TCC",
  deprisa: "Deprisa",
  envia: "Envía",
  dhl: "DHL",
  fedex: "FedEx",
  "99minutos": "99 Minutos",
  mensajerosurbanos: "Mensajeros Urbanos",
};

/** Nombre legible de la transportadora a partir del identificador de Envia. */
export function carrierName(slug: string | null | undefined): string {
  if (!slug) return "";
  const key = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
  return CARRIER_NAMES[key] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

const STATUSES: ShipmentStatus[] = [
  "LABEL_CREATED",
  "IN_TRANSIT",
  "DELIVERED",
  "EXCEPTION",
  "CANCELLED",
];

export function toShipmentStatus(raw: unknown): ShipmentStatus {
  return STATUSES.includes(raw as ShipmentStatus) ? (raw as ShipmentStatus) : "LABEL_CREATED";
}

/** Solo enlaces http(s): vienen de un tercero (Envia). */
export function safeHttpUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw) return null;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function mapAdminShipment(raw: Record<string, unknown>): AdminShipment {
  return {
    id: String(raw.id ?? ""),
    carrier: String(raw.carrier ?? ""),
    service: String(raw.service ?? ""),
    trackingNumber: String(raw.trackingNumber ?? ""),
    labelUrl: safeHttpUrl(raw.labelUrl),
    trackingUrl: safeHttpUrl(raw.trackingUrl),
    costCents: Number(raw.costCents ?? 0),
    status: toShipmentStatus(raw.status),
    statusDetail: typeof raw.statusDetail === "string" ? raw.statusDetail : null,
    lastEventAt: typeof raw.lastEventAt === "string" ? raw.lastEventAt : null,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : "",
  };
}
