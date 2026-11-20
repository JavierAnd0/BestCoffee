"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, FileDown, Loader2, Package, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCop } from "@/lib/format";
import {
  cancelShippingLabelAction,
  createShippingLabelAction,
  quoteShippingAction,
} from "@/lib/actions/shipping";
import {
  carrierName,
  SHIPMENT_STATUS_LABEL,
  SHIPMENT_STATUS_TONE,
  type AdminShipment,
  type ShipmentOverrides,
  type ShippingQuote,
  type ShippingRate,
} from "@/lib/shipping";

type OrderStatus = "RECEIVED" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

/**
 * Guía de envío del pedido con Envia: cotizar, elegir transportadora,
 * generar la etiqueta y, mientras no la recojan, anularla. El estado del
 * pedido lo mueve después la transportadora (webhook o consulta periódica).
 */
export function ShippingLabelPanel({
  orderId,
  orderStatus,
  paid,
  shipments: initial,
  onLabelCreated,
}: {
  orderId: string;
  orderStatus: OrderStatus;
  paid: boolean;
  shipments: AdminShipment[];
  onLabelCreated: () => void;
}) {
  const [shipments, setShipments] = useState(initial);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const active = shipments.find((s) => s.status !== "CANCELLED") ?? null;
  const cancelled = shipments.filter((s) => s.status === "CANCELLED");
  const canCreate =
    paid && !active && (orderStatus === "RECEIVED" || orderStatus === "PREPARING");

  const handleCancel = () => {
    if (!active) return;
    if (!window.confirm(`¿Anular la guía ${active.trackingNumber}? Solo se puede si la transportadora aún no la recogió.`)) {
      return;
    }
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await cancelShippingLabelAction(orderId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setNotice(res.message);
      setShipments((list) => list.map((s) => (s.id === active.id ? { ...s, status: "CANCELLED" } : s)));
    });
  };

  return (
    <section className="rounded-lg border border-border bg-background p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Truck className="size-4 text-muted-foreground" />
          <h2 className="font-display text-lg font-semibold">Guía de envío</h2>
        </div>
        {canCreate && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Package className="size-3.5 mr-1.5" />
            Cotizar y generar guía
          </Button>
        )}
      </header>

      {error && (
        <p role="alert" className="mb-3 text-xs text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-3 text-xs text-emerald-700">
          {notice}
        </p>
      )}

      {active ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={SHIPMENT_STATUS_TONE[active.status]}>
              {SHIPMENT_STATUS_LABEL[active.status]}
            </Badge>
            <span className="text-sm font-medium">{carrierName(active.carrier)}</span>
            <span className="text-xs text-muted-foreground">· {active.service}</span>
          </div>
          <dl className="grid sm:grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Número de guía</dt>
              <dd className="font-mono tabular-nums">{active.trackingNumber}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Costo de la guía</dt>
              <dd className="tabular-nums">{formatCop(active.costCents)}</dd>
            </div>
            {active.statusDetail && (
              <div>
                <dt className="text-xs text-muted-foreground">Último evento</dt>
                <dd>{active.statusDetail}</dd>
              </div>
            )}
          </dl>
          {active.status === "EXCEPTION" && (
            <p className="text-xs text-amber-800 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
              La transportadora reportó una novedad. Revísala en tu panel de Envia y contacta al
              cliente si hace falta.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {active.labelUrl && (
              <Button
                variant="outline"
                size="sm"
                render={
                  <a href={active.labelUrl} target="_blank" rel="noopener noreferrer">
                    <FileDown className="size-3.5 mr-1.5" />
                    Etiqueta (PDF)
                  </a>
                }
              />
            )}
            {active.trackingUrl && (
              <Button
                variant="outline"
                size="sm"
                render={
                  <a href={active.trackingUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5 mr-1.5" />
                    Seguimiento
                  </a>
                }
              />
            )}
            {active.status === "LABEL_CREATED" && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                disabled={pending}
                onClick={handleCancel}
              >
                {pending && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                Anular guía
              </Button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {canCreate
            ? "Cotiza con las transportadoras de tu cuenta de Envia y genera la etiqueta. Cuando la transportadora recoja el paquete, el pedido pasa solo a Enviado y luego a Entregado."
            : !paid
              ? "La guía se genera cuando el pedido está pagado."
              : "Este pedido no tiene guía de Envia."}
        </p>
      )}

      {cancelled.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Guías anuladas: {cancelled.map((s) => `${carrierName(s.carrier)} ${s.trackingNumber}`).join(", ")}
        </p>
      )}

      {open && (
        <QuoteDialog
          orderId={orderId}
          onClose={() => setOpen(false)}
          onCreated={(shipment) => {
            setShipments((list) => [shipment, ...list]);
            setOpen(false);
            setError(null);
            setNotice(`Guía ${shipment.trackingNumber} generada con ${carrierName(shipment.carrier)}.`);
            onLabelCreated();
          }}
        />
      )}
    </section>
  );
}

function QuoteDialog({
  orderId,
  onClose,
  onCreated,
}: {
  orderId: string;
  onClose: () => void;
  onCreated: (s: AdminShipment) => void;
}) {
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [overrides, setOverrides] = useState<ShipmentOverrides>({});
  const [needsDane, setNeedsDane] = useState(false);
  const [selected, setSelected] = useState<ShippingRate | null>(null);
  const [printSize, setPrintSize] = useState<"PAPER_4X6" | "PAPER_LETTER">("PAPER_4X6");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // La petición y sus efectos van después del await: así la primera
  // cotización puede salir desde el efecto de apertura sin setState síncrono.
  const fetchQuote = useCallback(
    (next: ShipmentOverrides) =>
      startTransition(async () => {
        const res = await quoteShippingAction(orderId, next);
        if (!res.ok) {
          setError(res.error);
          if (/c[oó]digo DANE/i.test(res.error)) setNeedsDane(true);
          return;
        }
        const data = res.data ?? null;
        setQuote(data);
        if (data) {
          setOverrides((o) => ({ ...o, ...data.package }));
          setSelected(data.rates[0] ?? null);
        }
      }),
    [orderId],
  );

  useEffect(() => {
    fetchQuote({});
  }, [fetchQuote]);

  const runQuote = (next: ShipmentOverrides) => {
    setError(null);
    setSelected(null);
    fetchQuote(next);
  };

  const generate = () => {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await createShippingLabelAction(orderId, {
        ...overrides,
        carrier: selected.carrier,
        service: selected.service,
        printSize,
      });
      if (!res.ok || !res.data) {
        setError(res.ok ? "Envia no devolvió la guía." : res.error);
        return;
      }
      onCreated(res.data);
    });
  };

  const num = (key: keyof ShipmentOverrides, label: string, step = "1") => (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type="number"
        step={step}
        min={0}
        value={overrides[key] ?? ""}
        onChange={(e) =>
          setOverrides((o) => ({
            ...o,
            [key]: e.target.value === "" ? undefined : Number(e.target.value),
          }))
        }
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs tabular-nums"
      />
    </label>
  );

  return (
    <Dialog open onOpenChange={(o) => !pending && !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-semibold">Generar guía</DialogTitle>
          <DialogDescription>
            Elige la transportadora. La guía se cobra de tu saldo de Envia.
            {quote?.test && " Estás en modo de pruebas: no se despacha ni se cobra."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {num("weightKg", "Peso (kg)", "0.1")}
            {num("lengthCm", "Largo (cm)")}
            {num("widthCm", "Ancho (cm)")}
            {num("heightCm", "Alto (cm)")}
          </div>
          {needsDane && (
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-xs text-muted-foreground">Código DANE del destino</span>
                <input
                  inputMode="numeric"
                  placeholder="05001000"
                  value={overrides.destinationCityCode ?? ""}
                  onChange={(e) =>
                    setOverrides((o) => ({ ...o, destinationCityCode: e.target.value.trim() || undefined }))
                  }
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono"
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground">Departamento (código Envia)</span>
                <input
                  placeholder="AN"
                  maxLength={3}
                  value={overrides.destinationStateCode ?? ""}
                  onChange={(e) =>
                    setOverrides((o) => ({
                      ...o,
                      destinationStateCode: e.target.value.trim().toUpperCase() || undefined,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono uppercase"
                />
              </label>
            </div>
          )}
          <Button variant="outline" size="sm" disabled={pending} onClick={() => runQuote(overrides)}>
            {pending && !quote && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
            Volver a cotizar
          </Button>

          {error && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
              {/Conecta tu cuenta de Envia/i.test(error) && (
                <>
                  {" "}
                  <Link href="/admin/configuracion" className="underline">
                    Ir a Configuración
                  </Link>
                </>
              )}
            </p>
          )}

          {pending && !quote && !error && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Cotizando con las transportadoras…
            </p>
          )}

          {quote && (
            <fieldset className="max-h-72 overflow-y-auto rounded-md border border-border divide-y divide-border">
              <legend className="sr-only">Tarifas</legend>
              {quote.rates.map((r) => {
                const id = `${r.carrier}:${r.service}`;
                const checked = selected?.carrier === r.carrier && selected?.service === r.service;
                return (
                  <label key={id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50">
                    <input
                      type="radio"
                      name="rate"
                      checked={checked}
                      onChange={() => setSelected(r)}
                      className="size-4 accent-primary"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium">{carrierName(r.carrier)}</span>
                      <span className="block text-xs text-muted-foreground">
                        {r.serviceDescription || r.service}
                        {r.deliveryEstimate && ` · ${r.deliveryEstimate}`}
                      </span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{formatCop(r.totalCents)}</span>
                  </label>
                );
              })}
            </fieldset>
          )}

          {quote && (
            <label className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Tamaño de la etiqueta</span>
              <select
                value={printSize}
                onChange={(e) => setPrintSize(e.target.value as "PAPER_4X6" | "PAPER_LETTER")}
                className="rounded-md border border-input bg-background px-2 py-1"
              >
                <option value="PAPER_4X6">Térmica 4×6</option>
                <option value="PAPER_LETTER">Carta</option>
              </select>
            </label>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={pending || !selected} onClick={generate}>
            {pending && quote && <Loader2 className="size-4 animate-spin mr-1.5" />}
            {selected ? `Generar guía · ${formatCop(selected.totalCents)}` : "Generar guía"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
