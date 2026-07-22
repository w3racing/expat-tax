import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import {
  EvidenceStatusPill,
  type EvidenceStatus,
} from '@/shared/components/ajx/evidence-status-pill'

type EvidenceListItemProps = {
  title: string
  meta: string
  amount?: string
  status: EvidenceStatus
  leading?: ReactNode
  onClick?: () => void
  className?: string
}

export function EvidenceListItem({
  title,
  meta,
  amount,
  status,
  leading,
  onClick,
  className,
}: EvidenceListItemProps) {
  const Comp = onClick ? 'button' : 'div'

  return (
    <Comp
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left shadow-xs transition-colors',
        onClick && 'hover:bg-muted/60',
        className,
      )}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-accent text-primary">
        {leading}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <EvidenceStatusPill status={status} />
        </div>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {amount ? <span className="text-amount text-sm font-medium">{amount}</span> : null}
        {onClick ? <ChevronRight aria-hidden className="size-4 text-[var(--ajx-ink-300)]" /> : null}
      </div>
    </Comp>
  )
}
