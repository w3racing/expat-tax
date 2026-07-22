import { cn } from '@/shared/lib/cn'

const STEPS = [
  { id: 'create', label: 'Create' },
  { id: 'receipts', label: 'Enter receipts' },
  { id: 'review', label: 'Review totals' },
  { id: 'complete', label: 'Complete' },
] as const

type SampleDayWorkflowStepsProps = {
  /** 0 create, 1 receipts, 2 review, 3 complete */
  activeIndex: number
  completed: boolean
}

export function SampleDayWorkflowSteps({ activeIndex, completed }: SampleDayWorkflowStepsProps) {
  return (
    <ol className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
      {STEPS.map((step, index) => {
        const done = completed || index < activeIndex
        const current = !completed && index === activeIndex
        return (
          <li key={step.id} className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold',
                done && 'bg-success text-success-foreground',
                current && 'bg-primary text-primary-foreground',
                !done && !current && 'bg-muted text-muted-foreground',
              )}
            >
              {done ? '✓' : index + 1}
            </span>
            <span
              className={cn(
                'text-sm font-medium',
                current || done ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 ? (
              <span aria-hidden className="mx-1 hidden text-muted-foreground sm:inline">
                →
              </span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

export function workflowStepIndex(opts: {
  receiptCount: number
  status: 'in_progress' | 'complete'
}): number {
  if (opts.status === 'complete') return 3
  if (opts.receiptCount === 0) return 1
  return 2
}
