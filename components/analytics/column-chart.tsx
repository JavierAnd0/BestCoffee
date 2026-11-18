"use client";

import { useState } from "react";
import { formatBucket, formatValue, type ValueFormat } from "./format";

export interface ColumnSeries {
  name: string;
  /** Color categórico (ver PALETTE en ./format). */
  color: string;
}

/**
 * Columnas apiladas sin dependencias. Una barra por cubeta del rango; cada
 * serie es un segmento con 2 px de separación. Al pasar el mouse (o el foco)
 * sobre una columna aparece el detalle; la leyenda siempre está y hay vista
 * de tabla para leer los números sin depender del color.
 */
export function ColumnChart({
  data,
  series,
  format,
  granularity,
  height = 200,
  title,
}: {
  data: { date: string; values: number[] }[];
  series: ColumnSeries[];
  format: ValueFormat;
  granularity: "day" | "week" | "month";
  height?: number;
  title: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const totals = data.map((d) => d.values.reduce((a, v) => a + v, 0));
  const max = Math.max(...totals, 1);
  const seriesTotals = series.map((_, i) => data.reduce((a, d) => a + (d.values[i] ?? 0), 0));
  const empty = totals.every((t) => t === 0);
  const labelIdx = new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]);

  return (
    <figure className="w-full" aria-label={title}>
      {series.length > 1 && (
        <figcaption className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-xs">
          {series.map((s, i) => (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
              <span className="text-muted-foreground">{s.name}</span>
              <span className="font-medium tabular-nums">{formatValue(seriesTotals[i], format)}</span>
            </span>
          ))}
        </figcaption>
      )}

      <div className="relative" style={{ height }}>
        {/* Rejilla recesiva: base, mitad y máximo */}
        {[1, 0.5, 0].map((f) => (
          <div
            key={f}
            className="absolute inset-x-0 border-t border-border/70"
            style={{ top: `${(1 - f) * 100}%` }}
          >
            {f > 0 && !empty && (
              <span className="absolute -top-2 right-0 bg-background pl-1 text-[10px] tabular-nums text-muted-foreground">
                {formatValue(max * f, format, true)}
              </span>
            )}
          </div>
        ))}

        {empty ? (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            Sin datos en este periodo
          </div>
        ) : (
          <div className="absolute inset-0 flex items-end gap-[2px] pr-12">
            {data.map((d, i) => (
              <button
                key={d.date}
                type="button"
                className="relative flex h-full min-w-0 flex-1 flex-col justify-end outline-none"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                aria-label={`${formatBucket(d.date, granularity)}: ${formatValue(totals[i], format)}`}
              >
                <span
                  className={
                    "flex w-full flex-col-reverse gap-[2px] transition-opacity " +
                    (active !== null && active !== i ? "opacity-50" : "")
                  }
                  style={{ height: `${(totals[i] / max) * 100}%` }}
                >
                  {d.values.map((v, s) =>
                    v > 0 ? (
                      <span
                        key={s}
                        className="w-full first:rounded-b-none last:rounded-t-[4px]"
                        style={{
                          background: series[s].color,
                          flexGrow: v,
                          flexBasis: 0,
                          minHeight: 2,
                        }}
                      />
                    ) : null,
                  )}
                </span>
              </button>
            ))}
          </div>
        )}

        {active !== null && !empty && (
          <div
            role="status"
            className="pointer-events-none absolute -top-2 z-10 min-w-40 -translate-y-full rounded-md border border-border bg-background px-3 py-2 text-xs shadow-md"
            style={{
              left: `clamp(0px, calc(${((active + 0.5) / data.length) * 100}% - 80px), calc(100% - 160px))`,
            }}
          >
            <div className="font-medium">{formatBucket(data[active].date, granularity)}</div>
            {series.map((s, i) => (
              <div key={s.name} className="mt-1 flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted-foreground">
                  <span className="size-2 rounded-sm" style={{ background: s.color }} aria-hidden />
                  {s.name}
                </span>
                <span className="tabular-nums">{formatValue(data[active].values[i] ?? 0, format)}</span>
              </div>
            ))}
            {series.length > 1 && (
              <div className="mt-1 flex justify-between gap-4 border-t border-border pt-1 font-medium">
                <span>Total</span>
                <span className="tabular-nums">{formatValue(totals[active], format)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 flex pr-12 text-[10px] text-muted-foreground">
        {data.map((d, i) => (
          <span key={d.date} className="min-w-0 flex-1 text-center whitespace-nowrap">
            {labelIdx.has(i) ? formatBucket(d.date, granularity) : ""}
          </span>
        ))}
      </div>

      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Ver como tabla
        </summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-md border border-border">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-1.5 font-medium">Periodo</th>
                {series.map((s) => (
                  <th key={s.name} className="px-3 py-1.5 text-right font-medium">
                    {s.name}
                  </th>
                ))}
                {series.length > 1 && <th className="px-3 py-1.5 text-right font-medium">Total</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={d.date} className="border-t border-border">
                  <td className="px-3 py-1">{formatBucket(d.date, granularity)}</td>
                  {series.map((s, si) => (
                    <td key={s.name} className="px-3 py-1 text-right tabular-nums">
                      {formatValue(d.values[si] ?? 0, format)}
                    </td>
                  ))}
                  {series.length > 1 && (
                    <td className="px-3 py-1 text-right tabular-nums">{formatValue(totals[i], format)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
