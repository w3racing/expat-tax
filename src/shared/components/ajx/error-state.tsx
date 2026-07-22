import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/cn'
import { getErrorEntry, type ErrorCode } from '@/shared/lib/errors'

type ErrorStateProps = {
  code?: ErrorCode
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  secondaryAction?: ReactNode
  className?: string
}

/** Full-region error surface (not a toast) — calm, actionable, non-technical. */
export function ErrorState({
  code = 'UNKNOWN',
  title,
  description,
  actionLabel,
  onAction,
  secondaryAction,
  className,
}: ErrorStateProps) {
  const entry = getErrorEntry(code)

  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-2xl border border-destructive/25 bg-card px-6 py-12 text-center shadow-sm',
        className,
      )}
      role="alert"
    >
      <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-destructive-soft text-destructive">
        <AlertTriangle aria-hidden className="size-6" />
      </div>
      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
        {title ?? entry.title}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description ?? entry.description}
      </p>
      {onAction ? (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel ?? entry.action ?? 'Retry'}
        </Button>
      ) : null}
      {secondaryAction ? <div className="mt-3">{secondaryAction}</div> : null}
    </div>
  )
}
