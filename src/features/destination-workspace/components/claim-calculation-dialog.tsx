import type { DestinationWorkspaceStats } from '@/features/destination-workspace/utils/destination-stats'
import type { DestinationAverageCalculation } from '@/features/destination-workspace/utils/destination-average-calc'
import { DestinationAverageBreakdown } from '@/features/destination-workspace/components/destination-average-breakdown'
import { formatAud, formatNumber } from '@/shared/lib/format'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'

type ClaimCalculationDialogProps = {
  open: boolean
  stats: DestinationWorkspaceStats
  calculation: DestinationAverageCalculation | null
  destinationId: string
  onOpenChange: (open: boolean) => void
}

export function ClaimCalculationDialog({
  open,
  stats,
  calculation,
  destinationId,
  onOpenChange,
}: ClaimCalculationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Claim calculation — {stats.destinationName}</DialogTitle>
          <DialogDescription>
            Sample Days → Average → Calculation → Final Claim. Identical to AJX Calculator overnight
            maths: average of completed sample days, then nights × average.
          </DialogDescription>
        </DialogHeader>

        {calculation ? (
          <DestinationAverageBreakdown calc={calculation} destinationId={destinationId} />
        ) : (
          <div className="space-y-3 text-sm">
            <p>Qualifying overnights: {formatNumber(stats.qualifyingOvernights)}</p>
            <p>Claim: {formatAud(stats.currentClaimAud, 2)}</p>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
