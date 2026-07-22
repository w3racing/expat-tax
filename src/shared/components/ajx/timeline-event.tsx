import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type TimelineEventProps = {
  title: string
  meta: string
  children?: ReactNode
  className?: string
}

export function TimelineEvent({ title, meta, children, className }: TimelineEventProps) {
  return (
    <li className={cn('relative', className)}>
      <span
        aria-hidden
        className="absolute top-1.5 -left-[1.91rem] size-3 rounded-full border-2 border-primary bg-card"
      />
      <div className="space-y-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{meta}</p>
        </div>
        {children}
      </div>
    </li>
  )
}
