import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

type ProgressProps = HTMLAttributes<HTMLDivElement> & {
  value: number
  max?: number
  label?: string
}

export function Progress({ value, max = 100, label, className, ...props }: ProgressProps) {
  const clamped = Math.min(Math.max(value, 0), max)
  const percent = max === 0 ? 0 : (clamped / max) * 100

  return (
    <div
      aria-label={label}
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={clamped}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-secondary', className)}
      role="progressbar"
      {...props}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-[var(--duration-normal)] ease-[var(--ease-out)]"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
