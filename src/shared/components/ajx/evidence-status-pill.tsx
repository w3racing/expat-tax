import { AnimatePresence, motion } from 'framer-motion'
import { CircleAlert, CircleCheck, LoaderCircle, Upload } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { transitionNormal } from '@/shared/lib/motion'

export type EvidenceStatus = 'uploaded' | 'processing' | 'ready' | 'needs_review' | 'failed'

const statusConfig: Record<
  EvidenceStatus,
  { label: string; className: string; icon: typeof CircleCheck }
> = {
  uploaded: {
    label: 'Uploaded',
    className: 'bg-secondary text-muted-foreground',
    icon: Upload,
  },
  processing: {
    label: 'Organising',
    className: 'bg-primary-soft text-accent-foreground',
    icon: LoaderCircle,
  },
  ready: {
    label: 'Ready',
    className: 'bg-success-soft text-success',
    icon: CircleCheck,
  },
  needs_review: {
    label: 'Needs a look',
    className: 'bg-warning-soft text-warning',
    icon: CircleAlert,
  },
  failed: {
    label: 'Failed',
    className: 'bg-destructive-soft text-destructive',
    icon: CircleAlert,
  },
}

type EvidenceStatusPillProps = {
  status: EvidenceStatus
  className?: string
}

export function EvidenceStatusPill({ status, className }: EvidenceStatusPillProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={status}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-semibold',
          config.className,
          className,
        )}
        exit={{ opacity: 0, y: -2 }}
        initial={{ opacity: 0, y: 2 }}
        transition={transitionNormal}
      >
        <Icon
          aria-hidden
          className={cn('size-3.5', status === 'processing' && 'animate-spin')}
        />
        {config.label}
      </motion.span>
    </AnimatePresence>
  )
}
