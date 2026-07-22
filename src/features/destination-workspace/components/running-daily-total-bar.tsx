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

/** Sticky bar for fast mobile receipt entry — always shows live day total. */
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
        'sticky bottom-20 z-30 -mx-4 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-8px_24px_rgba(12,21,36,0.08)] backdrop-blur md:bottom-4 md:mx-0 md:rounded-2xl md:border',
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
