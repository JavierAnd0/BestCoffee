import { Mail, AlertTriangle } from "lucide-react";

export interface EmailUsage {
  available: boolean;
  sentToday: number;
  dailyLimit: number | null;
  remainingToday: number | null;
  sentThisMonth: number;
  monthlyLimit: number | null;
  remainingThisMonth: number | null;
  monthIsPartial: boolean;
  resetsAt: string;
}

function tone(used: number, limit: number | null) {
  if (!limit) return "ok" as const;
  const pct = used / limit;
  if (pct >= 1) return "full" as const;
  if (pct >= 0.8) return "high" as const;
  return "ok" as const;
}

const BAR = { ok: "bg-foreground/70", high: "bg-amber-500", full: "bg-red-600" };

function Meter({
  label,
  used,
  limit,
  remaining,
  foot,
}: {
  label: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  foot: string;
}) {
  const t = tone(used, limit);
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm tabular-nums">
          <span className="font-semibold text-foreground">{used.toLocaleString("es-CO")}</span>
          <span className="text-muted-foreground"> / {limit ? limit.toLocaleString("es-CO") : "sin límite"}</span>
        </span>
      </div>
      {limit ? (
        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden>
          <div className={`h-full rounded-full ${BAR[t]}`} style={{ width: `${pct}%` }} />
        </div>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        {remaining !== null ? `Quedan ${remaining.toLocaleString("es-CO")}. ` : ""}
        {foot}
      </p>
    </div>
  );
}

/**
 * Cupo de correos de Resend (compartido por todas las tiendas). Avisa al 80 %
 * y al agotarse: sin cupo no salen enlaces de acceso ni confirmaciones.
 */
export function EmailQuotaCard({ usage }: { usage: EmailUsage | null }) {
  if (!usage || !usage.available) {
    return (
      <div className="rounded-lg border border-border bg-background p-5 flex items-center gap-3 text-sm text-muted-foreground">
        <Mail className="size-4 shrink-0" />
        No se pudo consultar el cupo de correos de Resend.
      </div>
    );
  }

  const day = tone(usage.sentToday, usage.dailyLimit);
  const month = tone(usage.sentThisMonth, usage.monthlyLimit);
  const worst = day === "full" || month === "full" ? "full" : day === "high" || month === "high" ? "high" : "ok";
  const reset = new Date(usage.resetsAt).toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Bogota",
  });

  return (
    <div
      className={`rounded-lg border bg-background p-5 ${
        worst === "full" ? "border-red-600/40" : worst === "high" ? "border-amber-500/50" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Mail className="size-4" />
          Correos enviados
        </h2>
        <span className="text-xs text-muted-foreground">Resend · todas las tiendas</span>
      </div>

      {worst !== "ok" && (
        <p
          className={`mb-4 flex items-start gap-2 text-sm ${
            worst === "full" ? "text-red-700" : "text-amber-700"
          }`}
        >
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          {worst === "full"
            ? "Se agotó el cupo: los correos (accesos, pedidos) no van a salir hasta que se reinicie o subas de plan."
            : "Vas por encima del 80 % del cupo. Considera subir de plan en Resend antes de que se agote."}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        <Meter
          label="Hoy"
          used={usage.sentToday}
          limit={usage.dailyLimit}
          remaining={usage.remainingToday}
          foot={`Se reinicia a las ${reset} (hora Colombia).`}
        />
        <Meter
          label="Este mes"
          used={usage.sentThisMonth}
          limit={usage.monthlyLimit}
          remaining={usage.remainingThisMonth}
          foot={usage.monthIsPartial ? "Conteo parcial (mínimo)." : "Se reinicia el día 1."}
        />
      </div>
    </div>
  );
}
