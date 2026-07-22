import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { useDestinationWorkspace } from '@/features/destination-workspace/hooks/use-destination-workspace'
import {
  completionStatusLabel,
  primaryCurrency,
  sampleDayTotalAud,
} from '@/features/destination-workspace/types/sample-day'
import {
  useClaimOrigin,
  withClaimOrigin,
} from '@/features/quick-claim/utils/claim-origin'
import { PageHeader } from '@/shared/components/ajx/page-header'
import { EmptyState } from '@/shared/components/ajx/empty-state'
import { SoftBanner } from '@/shared/components/ajx/soft-banner'
import { Button } from '@/shared/components/ui/button'
import { formatAud } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'

export function SampleDaysPage() {
  const { destinationId } = useParams<{ destinationId: string }>()
  const navigate = useNavigate()
  const workspace = useDestinationWorkspace(destinationId)
  const { fromClaim, destinationsBackTo } = useClaimOrigin()

  if (!destinationId) return <Navigate replace to={destinationsBackTo} />

  if (!workspace.destination) {
    return (
      <EmptyState
        actionLabel={fromClaim ? 'Back to Destinations' : 'Back to planner'}
        description="Destination not found."
        title="Missing destination"
        onAction={() => navigate(destinationsBackTo)}
      />
    )
  }

  const workspacePath = withClaimOrigin(`/overnight/${destinationId}`, fromClaim)

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link to={workspacePath}>
                <ArrowLeft className="size-4" />
                {workspace.destination.name}
              </Link>
            </Button>
            <Button size="sm" onClick={() => workspace.createAndOpenSampleDay(fromClaim)}>
              <Plus className="size-4" />
              New Sample Day
            </Button>
          </div>
        }
        description={`${workspace.destination.name} · Create → enter receipts → review → complete`}
        title="Sample days"
      />

      <SoftBanner tone="info">
        Completed days update the average and Tax Position automatically. Days still in progress
        stay out of the average until you complete them.
      </SoftBanner>

      {workspace.sampleDays.length === 0 ? (
        <EmptyState
          actionLabel="New Sample Day"
          description="Pick a typical day away, enter the receipts, review the total, then complete it."
          title="No sample days yet"
          onAction={() => workspace.createAndOpenSampleDay(fromClaim)}
        />
      ) : (
        <ul className="space-y-2">
          {workspace.sampleDays.map((day) => (
            <li key={day.id}>
              <button
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-4 text-left shadow-sm transition-colors',
                  'hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  day.status === 'complete' && 'border-success/30 bg-success-soft/40',
                )}
                type="button"
                onClick={() =>
                  navigate(
                    withClaimOrigin(
                      `/overnight/${destinationId}/sample-days/${day.id}`,
                      fromClaim,
                    ),
                  )
                }
              >
                <div>
                  <p className="font-display text-base font-semibold text-foreground">{day.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {completionStatusLabel(day.status)} · {day.receipts.length} receipt
                    {day.receipts.length === 1 ? '' : 's'} · {primaryCurrency(day)}
                  </p>
                </div>
                <p className="font-display text-lg font-semibold tabular-nums text-foreground">
                  {formatAud(sampleDayTotalAud(day), 0)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
