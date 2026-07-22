import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { getErrorEntry, type ErrorCode } from '@/shared/lib/errors'
import { cn } from '@/shared/lib/cn'

type ErrorBannerProps = {
  code?: ErrorCode
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  onDismiss?: () => void
  className?: string
}

export function ErrorBanner({
  code = 'UNKNOWN',
  title,
  description,
  actionLabel,
  onAction,
  onDismiss,
  className,
}: ErrorBannerProps) {
  const entry = getErrorEntry(code)
  return (
    <div
      className={cn(
        'flex gap-3 rounded-xl border border-destructive/30 bg-destructive-soft px-4 py-3',
        className,
      )}
      role="alert"
    >
      <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-destructive" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title ?? entry.title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description ?? entry.description}</p>
        {onAction ? (
          <Button className="mt-2" size="sm" variant="outline" onClick={onAction}>
            {actionLabel ?? entry.action ?? 'Retry'}
          </Button>
        ) : null}
      </div>
      {onDismiss ? (
        <Button aria-label="Dismiss" size="icon" variant="ghost" onClick={onDismiss}>
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  )
}
