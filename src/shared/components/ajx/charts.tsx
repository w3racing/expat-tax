import { cn } from '@/shared/lib/cn'

type SparklineProps = {
  values: number[]
  className?: string
  /** Accessible summary of the series */
  label: string
  stroke?: string
}

/** Minimal SVG sparkline for dashboard cards. */
export function Sparkline({ values, className, label, stroke = 'var(--primary)' }: SparklineProps) {
  if (values.length < 2) {
    return <div aria-label={label} className={cn('h-10 w-full', className)} role="img" />
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const w = 120
  const h = 40
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / range) * (h - 4) - 2
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      aria-label={label}
      className={cn('h-10 w-full text-primary', className)}
      fill="none"
      preserveAspectRatio="none"
      role="img"
      viewBox={`0 0 ${w} ${h}`}
    >
      <polyline
        points={points}
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

type BarChartProps = {
  data: Array<{ label: string; value: number }>
  className?: string
  /** Accessible chart title */
  label: string
  max?: number
}

/** Simple horizontal bar chart — calm, no chart-library chrome. */
export function BarChart({ data, className, label, max }: BarChartProps) {
  const peak = max ?? Math.max(...data.map((d) => d.value), 1)

  return (
    <div
      aria-label={label}
      className={cn('space-y-2.5', className)}
      role="img"
    >
      {data.map((row) => (
        <div key={row.label} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3">
          <span className="truncate text-xs text-muted-foreground">{row.label}</span>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-[var(--duration-normal)]"
              style={{ width: `${Math.min(100, (row.value / peak) * 100)}%` }}
            />
          </div>
          <span className="text-amount text-xs font-medium text-foreground">
            {row.value.toLocaleString('en-AU')}
          </span>
        </div>
      ))}
    </div>
  )
}

type DonutChartProps = {
  value: number
  max?: number
  label: string
  className?: string
  size?: number
}

/** Completeness / proportion ring for dashboards. */
export function DonutChart({
  value,
  max = 100,
  label,
  className,
  size = 88,
}: DonutChartProps) {
  const pct = Math.max(0, Math.min(1, value / max))
  const r = 36
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct)

  return (
    <div className={cn('relative inline-flex', className)} style={{ width: size, height: size }}>
      <svg
        aria-label={`${label}: ${Math.round(pct * 100)}%`}
        className="size-full -rotate-90"
        role="img"
        viewBox="0 0 88 88"
      >
        <circle
          cx="44"
          cy="44"
          fill="none"
          r={r}
          stroke="var(--muted)"
          strokeWidth="8"
        />
        <circle
          cx="44"
          cy="44"
          fill="none"
          r={r}
          stroke="var(--primary)"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="8"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-sm font-semibold text-amount">
        {Math.round(pct * 100)}%
      </span>
    </div>
  )
}
