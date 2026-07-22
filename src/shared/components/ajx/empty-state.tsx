import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/components/ui/button'
import { IllustrationFrame } from '@/shared/components/ajx/illustration-frame'

type EmptyStateProps = {
  title: string
  description: string
  illustration?: ReactNode
  actionLabel?: string
  onAction?: () => void
  secondaryAction?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  illustration,
  actionLabel,
  onAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-sm',
        className,
      )}
    >
      {illustration ? <IllustrationFrame className="mb-6">{illustration}</IllustrationFrame> : null}
      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
      {secondaryAction ? <div className="mt-3">{secondaryAction}</div> : null}
    </div>
  )
}
