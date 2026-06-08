// Lean SVG bar chart so the admin shell stays dependency-free at MVP-1.
// Replace with Recharts when the API returns full series + ranges.

interface Props {
  data: number[];
  height?: number;
}

export function SalesChart({ data, height = 180 }: Props) {
  if (data.length === 0) return null;
  const max = Math.max(...data);
  const barWidth = 100 / data.length;
  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="Ventas últimos 14 días"
      >
        {data.map((v, i) => {
          const h = (v / max) * (height - 20);
          return (
            <g key={i}>
              <rect
                x={i * barWidth + barWidth * 0.18}
                y={height - h - 12}
                width={barWidth * 0.64}
                height={h}
                rx={0.6}
                fill="currentColor"
                className="text-foreground/80"
              />
            </g>
          );
        })}
        <line x1="0" y1={height - 12} x2="100" y2={height - 12} stroke="currentColor" strokeWidth="0.2" className="text-border" />
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground tabular-nums">
        <span>hace 14 d</span>
        <span>hoy</span>
      </div>
    </div>
  );
}
