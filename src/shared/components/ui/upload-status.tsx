import { AlertCircle, CheckCircle2, Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/cn'

export type UploadPhase = 'idle' | 'uploading' | 'processing' | 'ready' | 'failed'

type UploadStatusProps = {
  fileName: string
  phase: UploadPhase
  progress?: number
  errorMessage?: string
  onRetry?: () => void
  className?: string
}

const phaseCopy: Record<UploadPhase, string> = {
  idle: 'Waiting',
  uploading: 'Uploading…',
  processing: 'Processing…',
  ready: 'Ready',
  failed: 'Failed',
}

export function UploadStatus({
  fileName,
  phase,
  progress,
  errorMessage,
  onRetry,
  className,
}: UploadStatusProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border bg-card px-3 py-3',
        className,
      )}
    >
      <StatusIcon phase={phase} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{fileName}</p>
        <p className="text-xs text-muted-foreground">
          {phaseCopy[phase]}
          {typeof progress === 'number' && phase === 'uploading' ? ` · ${Math.round(progress)}%` : ''}
        </p>
        {errorMessage ? <p className="mt-1 text-xs text-destructive">{errorMessage}</p> : null}
      </div>
      {phase === 'failed' && onRetry ? (
        <Button aria-label="Retry upload" size="icon" variant="ghost" onClick={onRetry}>
          <RotateCcw className="size-4" />
        </Button>
      ) : null}
    </div>
  )
}

function StatusIcon({ phase }: { phase: UploadPhase }) {
  if (phase === 'ready') {
    return <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-success" />
  }
  if (phase === 'failed') {
    return <AlertCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-destructive" />
  }
  if (phase === 'uploading' || phase === 'processing') {
    return <Loader2 aria-hidden className="mt-0.5 size-5 shrink-0 animate-spin text-primary" />
  }
  return <div aria-hidden className="mt-0.5 size-5 shrink-0 rounded-full border border-border" />
}
