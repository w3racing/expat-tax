import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type TimelineRailProps = {
  children: ReactNode
  className?: string
}

export function TimelineRail({ children, className }: TimelineRailProps) {
  return (
    <ol className={cn('relative space-y-6 border-l border-[var(--ajx-line-soft)] pl-6', className)}>
      {children}
    </ol>
  )
}
