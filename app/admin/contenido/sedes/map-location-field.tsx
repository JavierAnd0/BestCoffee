"use client";

import { useState, useTransition } from "react";
import { Check, ExternalLink, Loader2, MapPin } from "lucide-react";
import { resolveMapsLinkAction } from "@/lib/actions/maps";
import { isShortMapsLink, parseMapsCoordinates } from "@/lib/maps-link";
import { TextField } from "../_components/fields";

const label = "block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5";

/**
 * Ubicación de la sede: se pega el enlace de Google Maps y las coordenadas se
 * llenan solas (los enlaces cortos de "Compartir" los resuelve el servidor).
 * Un mapa pequeño confirma que el punto es el correcto.
 */
export function MapLocationField({ lat: initialLat, lng: initialLng }: { lat: number | null; lng: number | null }) {
  const [lat, setLat] = useState(initialLat != null ? String(initialLat) : "");
  const [lng, setLng] = useState(initialLng != null ? String(initialLng) : "");
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [resolving, startResolve] = useTransition();
  const [showManual, setShowManual] = useState(false);

  const apply = (c: { lat: number; lng: number }) => {
    setLat(String(c.lat));
    setLng(String(c.lng));
    setStatus({ ok: true, text: "Listo: ubicamos la sede. Revisa el mapa." });
  };

  const readLink = (value: string) => {
    setLink(value);
    setStatus(null);
    const v = value.trim();
    if (!v) return;
    const direct = parseMapsCoordinates(v);
    if (direct) return apply(direct);
    if (isShortMapsLink(v)) {
      startResolve(async () => {
        const r = await resolveMapsLinkAction(v);
        if (r.ok) apply(r.data);
        else setStatus({ ok: false, text: r.error });
      });
      return;
    }
    if (/^https?:\/\//.test(v)) {
      setStatus({
        ok: false,
        text: "Ese enlace no trae la ubicación. Abre el lugar en Google Maps y copia el enlace de la barra del navegador.",
      });
    }
  };

  const latN = Number(lat);
  const lngN = Number(lng);
  const hasPoint = lat !== "" && lng !== "" && Number.isFinite(latN) && Number.isFinite(lngN);

  return (
    <div className="space-y-4">
      <div>
        <label className={label} htmlFor="maps-link">
          Enlace de Google Maps
        </label>
        <div className="flex items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:border-foreground/40">
          <span className="flex items-center pl-3 text-muted-foreground">
            {resolving ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
          </span>
          <input
            id="maps-link"
            value={link}
            onChange={(e) => readLink(e.target.value)}
            placeholder="Pega aquí el enlace del lugar"
            inputMode="url"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none"
          />
        </div>
        {status ? (
          <p
            role={status.ok ? "status" : "alert"}
            className={"mt-1.5 flex items-start gap-1.5 text-xs " + (status.ok ? "text-emerald-800" : "text-amber-800")}
          >
            {status.ok && <Check className="mt-px size-3.5 shrink-0" />}
            {status.text}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-muted-foreground">
            {resolving
              ? "Buscando la ubicación…"
              : "En Google Maps busca tu sede, toca Compartir y copia el enlace. También sirve el de la barra del navegador."}
          </p>
        )}
      </div>

      {hasPoint ? (
        <div className="overflow-hidden rounded-md border border-border">
          <iframe
            key={`${latN},${lngN}`}
            title="Vista previa de la ubicación"
            src={`https://maps.google.com/maps?q=${latN},${lngN}&z=16&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-48 w-full border-0 bg-muted"
          />
          <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2 text-xs">
            <span className="tabular-nums text-muted-foreground">
              {latN}, {lngN}
            </span>
            <a
              href={`https://www.google.com/maps?q=${latN},${lngN}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium hover:underline underline-offset-4"
            >
              Abrir en Google Maps <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      ) : (
        <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-900">
          Sin ubicación, el mapa de /tiendas no puede mostrar esta sede.
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowManual((s) => !s)}
          aria-expanded={showManual}
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {showManual ? "Ocultar coordenadas" : "Escribir las coordenadas a mano"}
        </button>
        {/* Siempre en el formulario (ocultas o no), para que viajen al guardar. */}
        <div className={showManual ? "mt-3 grid gap-4 sm:grid-cols-2" : "hidden"}>
          <TextField label="Latitud" name="lat" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="4.6443" />
          <TextField label="Longitud" name="lng" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-74.0628" />
        </div>
      </div>
    </div>
  );
}
