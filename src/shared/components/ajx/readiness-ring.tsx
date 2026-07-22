import { cn } from '@/shared/lib/cn'

type ReadinessRingProps = {
  score: number
  size?: number
  className?: string
  label?: string
}

export function ReadinessRing({
  score,
  size = 128,
  className,
  label = 'Return readiness',
}: ReadinessRingProps) {
  const clamped = Math.min(Math.max(score, 0), 100)
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div
      aria-label={`${label}: ${Math.round(clamped)} percent`}
      className={cn('relative inline-flex items-center justify-center', className)}
      role="img"
      style={{ width: size, height: size }}
    >
      <svg aria-hidden className="-rotate-90" height={size} width={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke="var(--ajx-mist-100)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke="var(--ajx-cerulean-600)"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth={stroke}
          style={{ transition: 'stroke-dashoffset var(--duration-slow) var(--ease-out)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {Math.round(clamped)}
        </span>
        <span className="text-overline">Ready</span>
      </div>
    </div>
  )
}
