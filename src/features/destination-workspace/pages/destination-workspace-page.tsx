import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calculator,
  CalendarDays,
  FileUp,
  MapPinned,
  Plus,
} from 'lucide-react'
import { useDestinationWorkspace } from '@/features/destination-workspace/hooks/use-destination-workspace'
import { DestinationStatCards } from '@/features/destination-workspace/components/destination-stat-cards'
import { DestinationAverageBreakdown } from '@/features/destination-workspace/components/destination-average-breakdown'
import { ClaimCalculationDialog } from '@/features/destination-workspace/components/claim-calculation-dialog'
import {
  useClaimOrigin,
  withClaimOrigin,
} from '@/features/quick-claim/utils/claim-origin'
import { PageHeader } from '@/shared/components/ajx/page-header'
import { EmptyState } from '@/shared/components/ajx/empty-state'
import { AppCard } from '@/shared/components/ajx/app-card'
import { SectionHeader } from '@/shared/components/ajx/section-header'
import { QuickActionBar, type QuickAction } from '@/shared/components/ajx/quick-action-bar'
import { Button } from '@/shared/components/ui/button'
import { SoftBanner } from '@/shared/components/ajx/soft-banner'
import { PageSkeleton } from '@/shared/components/ajx/loading-states'
import { formatAud, formatNumber } from '@/shared/lib/format'

export function DestinationWorkspacePage() {
  const { destinationId } = useParams<{ destinationId: string }>()
  const navigate = useNavigate()
  const workspace = useDestinationWorkspace(destinationId)
  const { fromClaim, destinationsBackTo, destinationsBackLabel } = useClaimOrigin()
  const [claimOpen, setClaimOpen] = useState(false)

  if (!destinationId) {
    return <Navigate replace to={destinationsBackTo} />
  }

  if (!workspace.destination || !workspace.stats) {
    return (
      <div className="space-y-6">
        <EmptyState
          actionLabel={fromClaim ? 'Back to Destinations' : 'Return to Overnight Planner'}
          description="This destination is not in your destination list for the active financial year."
          title="Destination not found"
          onAction={() => navigate(destinationsBackTo)}
        />
      </div>
    )
  }

  const { stats, destination, fyLabel, calculation } = workspace

  const actions: QuickAction[] = [
    {
      id: 'new-sample',
      label: 'New Sample Day',
      icon: <Plus className="size-4" />,
      onSelect: () => workspace.createAndOpenSampleDay(fromClaim),
    },
    {
      id: 'view-samples',
      label: 'View Sample Days',
      icon: <CalendarDays className="size-4" />,
      onSelect: () =>
        navigate(withClaimOrigin(`/overnight/${destinationId}/sample-days`, fromClaim)),
    },
    {
      id: 'upload',
      label: 'Upload Evidence',
      icon: <FileUp className="size-4" />,
      onSelect: () =>
        navigate(`/evidence?destination=${encodeURIComponent(destinationId)}`),
    },
    {
      id: 'claim',
      label: 'View Claim Calculation',
      icon: <Calculator className="size-4" />,
      onSelect: () => setClaimOpen(true),
    },
    {
      id: 'back',
      label: fromClaim ? 'Back to Destinations' : 'Return to Overnight Planner',
      icon: <ArrowLeft className="size-4" />,
      onSelect: () => navigate(destinationsBackTo),
    },
  ]

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        actions={
          <Button asChild size="sm" variant="ghost">
            <Link to={destinationsBackTo}>
              <ArrowLeft className="size-4" />
              {destinationsBackLabel}
            </Link>
          </Button>
        }
        description={
          fromClaim
            ? `${fyLabel} · Add sample days for meals and incidentals at this destination.`
            : `${fyLabel} · Home for overnight activity, sample days, evidence, and claim for this destination.`
        }
        title={destination.name}
      />

      <SoftBanner tone="info">
        {fromClaim
          ? 'Create a sample day, enter receipts, then complete it — the destination average and Tax Position update automatically.'
          : 'Qualifying overnights come from the overnight planner. When you complete sample days, the average daily spend updates the claim automatically — Tax Position stays in step.'}
      </SoftBanner>

      <DestinationStatCards stats={stats} />

      <AppCard
        header={
          <SectionHeader
            description="Everything for this destination in one place"
            title="Actions"
          />
        }
      >
        <QuickActionBar actions={actions} />
      </AppCard>

      {calculation ? (
        <DestinationAverageBreakdown calc={calculation} destinationId={destinationId} />
      ) : null}

      <AppCard header={<SectionHeader description="Next steps" title="Guidance" />}>
        {stats.qualifyingOvernights === 0 ? (
          <p className="text-sm text-muted-foreground">
            No overnight counts yet for {destination.name}.{' '}
            {fromClaim ? (
              <>
                Counts live in the{' '}
                <Link
                  className="font-medium text-primary underline-offset-2 hover:underline"
                  to="/overnight"
                >
                  Overnight tab
                </Link>
                . You can still add sample days now.
              </>
            ) : (
              <>
                <Link
                  className="font-medium text-primary underline-offset-2 hover:underline"
                  to="/overnight"
                >
                  Enter nights in the Overnight Planner
                </Link>
                .
              </>
            )}
          </p>
        ) : stats.sampleDaysCompleted === 0 ? (
          <p className="text-sm text-muted-foreground">
            You have {formatNumber(stats.qualifyingOvernights)} qualifying overnight
            {stats.qualifyingOvernights === 1 ? '' : 's'}. Create a sample day, enter receipts,
            then complete it — average, destination claim, and financial year claim recalculate
            automatically.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Claim of {formatAud(stats.currentClaimAud, 2)} is live on Tax Position. Trace every
            figure in the calculation below — Sample Days → Average → Calculation → Final Claim.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => workspace.createAndOpenSampleDay(fromClaim)}>
            <Plus className="size-4" />
            New Sample Day
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`/evidence?destination=${encodeURIComponent(destinationId)}`}>
              <MapPinned className="size-4" />
              Evidence
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => setClaimOpen(true)}>
            <Calculator className="size-4" />
            View Claim Calculation
          </Button>
        </div>
      </AppCard>

      <ClaimCalculationDialog
        open={claimOpen}
        stats={stats}
        calculation={calculation}
        destinationId={destinationId}
        onOpenChange={setClaimOpen}
      />
    </div>
  )
}

/** Skeleton while route lazy-loads (unused when parent Suspense covers). */
export function DestinationWorkspaceSkeleton() {
  return <PageSkeleton cards={6} />
}
