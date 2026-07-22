import { Check, Cloud, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export type DraftSaveState = 'idle' | 'saving' | 'saved' | 'error'

type DraftStatusProps = {
  state: DraftSaveState
  className?: string
}

const copy: Record<DraftSaveState, string> = {
  idle: '',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Not saved',
}

export function DraftStatus({ state, className }: DraftStatusProps) {
  if (state === 'idle') return null

  return (
    <span
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground',
        state === 'error' && 'text-destructive',
        className,
      )}
    >
      {state === 'saving' ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : null}
      {state === 'saved' ? <Check aria-hidden className="size-3.5 text-success" /> : null}
      {state === 'error' ? <Cloud aria-hidden className="size-3.5" /> : null}
      {copy[state]}
    </span>
  )
}
