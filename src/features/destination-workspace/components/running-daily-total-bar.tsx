import { formatAud } from '@/shared/lib/format'
import { Button } from '@/shared/components/ui/button'
import { Plus } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

type RunningDailyTotalBarProps = {
  totalAud: number
  receiptCount: number
  readOnly: boolean
  onAddReceipt?: () => void
  className?: string
}

/** In-flow summary for receipt entry — shows live day total without covering content. */
export function RunningDailyTotalBar({
  totalAud,
  receiptCount,
  readOnly,
  onAddReceipt,
  className,
}: RunningDailyTotalBarProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card px-4 py-4 shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-overline">Running daily total</p>
          <p className="font-display text-2xl font-semibold tabular-nums text-foreground">
            {formatAud(totalAud, 2)}
          </p>
          <p className="text-xs text-muted-foreground">
            {receiptCount} receipt{receiptCount === 1 ? '' : 's'} · AUD
          </p>
        </div>
        {!readOnly && onAddReceipt ? (
          <Button className="min-h-12 shrink-0" onClick={onAddReceipt}>
            <Plus className="size-4" />
            Add receipt
          </Button>
        ) : null}
      </div>
    </div>
  )
}
