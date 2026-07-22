import { Progress } from '@/shared/components/ui/progress'
import { cn } from '@/shared/lib/cn'

type JobProgressProps = {
  label: string
  phase?: string
  value?: number
  indeterminate?: boolean
  className?: string
}

export function JobProgress({
  label,
  phase,
  value = 0,
  indeterminate = false,
  className,
}: JobProgressProps) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn('space-y-2 rounded-xl border border-border bg-card p-4', className)}
      role="status"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {!indeterminate ? (
          <span className="text-amount text-xs text-muted-foreground">{Math.round(value)}%</span>
        ) : null}
      </div>
      {phase ? <p className="text-xs text-muted-foreground">{phase}</p> : null}
      <Progress
        aria-label={label}
        className={indeterminate ? 'animate-pulse' : undefined}
        value={indeterminate ? 40 : value}
      />
    </div>
  )
}
