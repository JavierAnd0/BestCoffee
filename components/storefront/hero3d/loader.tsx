/**
 * Estado de carga del hero 3D. Se ve desde el primer instante (mientras baja el
 * código de la escena y sus modelos) y se desvanece cuando la escena entra.
 * No importa three.js: así puede usarse como `loading` del import dinámico.
 */
export function HeroLoader({
  progress,
  hidden = false,
}: {
  /** 0–100. Sin valor, la barra se anima de forma indeterminada. */
  progress?: number;
  hidden?: boolean;
}) {
  const pct = progress == null ? null : Math.max(4, Math.min(100, Math.round(progress)));
  return (
    <div
      role="status"
      aria-hidden={hidden}
      className="absolute inset-0 z-[1] pointer-events-none flex items-start justify-center pt-[26svh] md:items-center md:pt-0 md:pl-[28%]"
      style={{ opacity: hidden ? 0 : 1, transition: "opacity 700ms ease" }}
    >
      {/* Un único anuncio: el porcentaje cambia muchas veces y no debe leerse cada vez. */}
      <span className="sr-only">Cargando la animación de inicio</span>
      <div className="flex flex-col items-center gap-5" aria-hidden>
        {/* Halo cálido donde aparecerá la escena */}
        <div className="relative h-28 w-28">
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              background:
                "radial-gradient(circle, rgba(224,159,103,0.34) 0%, rgba(184,92,50,0.12) 48%, transparent 72%)",
            }}
          />
          <div
            className="absolute inset-[38%] rounded-full animate-pulse"
            style={{ backgroundColor: "rgba(232,184,136,0.55)" }}
          />
        </div>
        <span
          className="text-[10px] font-mono uppercase tracking-[0.26em]"
          style={{ color: "rgba(244, 232, 217, 0.62)" }}
        >
          Preparando la escena{pct != null ? ` · ${pct}%` : ""}
        </span>
        <div
          className="h-px w-40 overflow-hidden"
          style={{ backgroundColor: "rgba(247, 239, 228, 0.16)" }}
        >
          <div
            className={pct == null ? "h-full w-1/3 animate-pulse" : "h-full"}
            style={{
              backgroundColor: "var(--accent)",
              width: pct == null ? undefined : `${pct}%`,
              transition: "width 300ms ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}
