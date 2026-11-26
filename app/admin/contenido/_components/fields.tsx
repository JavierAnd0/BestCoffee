// Piezas de formulario del panel de contenido, con el mismo estilo que el
// resto del panel (etiqueta en versalitas, campo con borde fino).

export const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40";

export function FieldLabel({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block admin-label mb-1.5">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function TextField({
  label,
  hint,
  className,
  ...props
}: { label: string; hint?: string } & React.ComponentProps<"input">) {
  return (
    <FieldLabel label={label} hint={hint}>
      <input {...props} className={inputClass + (className ? ` ${className}` : "")} />
    </FieldLabel>
  );
}

export function TextArea({
  label,
  hint,
  className,
  ...props
}: { label: string; hint?: string } & React.ComponentProps<"textarea">) {
  return (
    <FieldLabel label={label} hint={hint}>
      <textarea {...props} className={inputClass + " leading-relaxed" + (className ? ` ${className}` : "")} />
    </FieldLabel>
  );
}

export function FormError({ error }: { error?: string | null }) {
  if (!error) return null;
  return (
    <div role="alert" className="rounded-md border border-red-300/60 bg-red-50 px-3 py-2 text-xs text-red-800">
      {error}
    </div>
  );
}

export function FormSection({
  title,
  children,
  plain,
}: {
  title?: string;
  children: React.ReactNode;
  /** Sin caja: para formularios que ya van dentro de una tarjeta (edición en línea). */
  plain?: boolean;
}) {
  return (
    <section className={plain ? "space-y-4" : "rounded-lg border border-border bg-background p-6 space-y-4"}>
      {title && <h2 className="font-display text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function LoadError({ error }: { error: string }) {
  return (
    <div role="alert" className="rounded-lg border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-800">
      No se pudo cargar: {error}
    </div>
  );
}

/** El horario de una sede se guarda como texto; otro JSON se ignora. */
export function locationHoursText(hours: unknown): string {
  return typeof hours === "string" ? hours : "";
}
