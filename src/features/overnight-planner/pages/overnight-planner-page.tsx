import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPinned, Plus } from 'lucide-react'
import { useTaxPosition } from '@/features/tax-position'
import { AddDestinationDialog } from '@/features/overnight-planner/components/add-destination-dialog'
import { OvernightPlannerGrid } from '@/features/overnight-planner/components/overnight-planner-grid'
import {
  rateMapForFy,
  removeDestinationFromPlanner,
  setNightsAt,
  sortedDestinations,
  upsertDestinationRate,
  yearClaimAud,
  yearNightsTotal,
} from '@/features/overnight-planner/utils/overnight-matrix'
import { EmptyState } from '@/shared/components/ajx/empty-state'
import { FySelect } from '@/shared/components/ajx/fy-select'
import { PageHeader } from '@/shared/components/ajx/page-header'
import { Button } from '@/shared/components/ui/button'
import { DraftStatus } from '@/shared/components/ui/draft-status'
import { formatAud, formatNumber } from '@/shared/lib/format'

export function OvernightPlannerPage() {
  const {
    fyEndYear,
    label,
    planner,
    year,
    draftState,
    persistYear,
    persistPlanner,
  } = useTaxPosition()

  const [addOpen, setAddOpen] = useState(false)

  const destinations = useMemo(
    () => sortedDestinations(planner.destinations),
    [planner.destinations],
  )
  const rates = planner.ratesByFy[String(fyEndYear)] ?? []
  const rateMap = useMemo(() => rateMapForFy(rates), [rates])
  const destIds = destinations.map((d) => d.id)
  const fyClaim = yearClaimAud(year.monthAway, rateMap, destIds)
  const fyNights = yearNightsTotal(year.monthAway, destIds)

  const onNightsChange = (monthKey: string, destinationId: string, nights: number) => {
    persistYear({
      ...year,
      monthAway: setNightsAt(year.monthAway, monthKey, destinationId, nights),
    })
  }

  const onRateChange = (destinationId: string, dailyRateAud: number) => {
    const key = String(fyEndYear)
    persistPlanner({
      ...planner,
      ratesByFy: {
        ...planner.ratesByFy,
        [key]: upsertDestinationRate(rates, destinationId, dailyRateAud),
      },
    })
  }

  const onAddDestination = (name: string, dailyRateAud: number) => {
    const id = crypto.randomUUID()
    const sortOrder =
      destinations.length === 0
        ? 0
        : Math.max(...destinations.map((d) => d.sortOrder)) + 1
    const key = String(fyEndYear)
    persistPlanner({
      ...planner,
      destinations: [...planner.destinations, { id, name, sortOrder }],
      ratesByFy: {
        ...planner.ratesByFy,
        [key]: upsertDestinationRate(rates, id, dailyRateAud),
      },
    })
  }

  const onRemoveDestination = (destinationId: string) => {
    const key = String(fyEndYear)
    const cleaned = removeDestinationFromPlanner(
      planner.destinations,
      rates,
      year.monthAway,
      destinationId,
    )
    persistPlanner({
      ...planner,
      destinations: cleaned.destinations,
      ratesByFy: {
        ...planner.ratesByFy,
        [key]: cleaned.rates,
      },
      years: planner.years.map((y) =>
        y.fyEndYear === fyEndYear ? { ...y, monthAway: cleaned.monthAway } : y,
      ),
    })
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DraftStatus state={draftState} />
            <FySelect />
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              Destination
            </Button>
          </div>
        }
        description="Enter qualifying overnights by destination and month. Claim = nights × daily rate — same maths as AJX Calculator."
        title="Overnight planner"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryTile label="Financial year" value={label} />
        <SummaryTile
          label="FY nights"
          value={formatNumber(fyNights)}
          hint="All destinations"
        />
        <SummaryTile
          label="FY claim"
          value={formatAud(fyClaim, 0)}
          hint="Nights × daily rates"
          emphasize
        />
      </div>

      {destinations.length === 0 ? (
        <EmptyState
          actionLabel="Add destination"
          description="Add destinations as columns, then enter overnight counts for each month. Rosters and receipts stay in Evidence — this grid is the source of truth."
          illustration={<MapPinned className="size-10 text-primary" />}
          title="No destinations yet"
          onAction={() => setAddOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Click a destination name to open its workspace · Arrow keys move between cells · Enter
            moves down · Totals update as you type.
          </p>
          <OvernightPlannerGrid
            destinations={destinations}
            fyEndYear={fyEndYear}
            monthAway={year.monthAway}
            rates={rates}
            onNightsChange={onNightsChange}
            onRateChange={onRateChange}
            onRemoveDestination={onRemoveDestination}
          />
          <p className="text-sm text-muted-foreground">
            Claim also appears on{' '}
            <Link className="font-medium text-primary underline-offset-2 hover:underline" to="/position">
              Tax Position
            </Link>
            . Upload supporting evidence anytime — it never overwrites this table.
          </p>
        </div>
      )}

      <AddDestinationDialog
        open={addOpen}
        onAdd={onAddDestination}
        onOpenChange={setAddOpen}
      />
    </div>
  )
}

function SummaryTile({
  label,
  value,
  hint,
  emphasize,
}: {
  label: string
  value: string
  hint?: string
  emphasize?: boolean
}) {
  return (
    <div
      className={
        emphasize
          ? 'rounded-2xl border border-primary/25 bg-primary-soft/60 px-4 py-4 dark:bg-primary/15'
          : 'rounded-2xl border border-border bg-card px-4 py-4 shadow-sm'
      }
    >
      <p className="text-overline">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
