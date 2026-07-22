import { Link } from 'react-router-dom'
import { MapPinned } from 'lucide-react'
import type { OvernightClaimProvenance } from '@/features/tax-position/utils/overnight-claim-provenance'
import { AppCard } from '@/shared/components/ajx/app-card'
import { SectionHeader } from '@/shared/components/ajx/section-header'
import { SoftBanner } from '@/shared/components/ajx/soft-banner'
import { Button } from '@/shared/components/ui/button'
import { formatAud, formatNumber } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'

type OvernightClaimPanelProps = {
  provenance: OvernightClaimProvenance
}

/**
 * First-class overnight claim on Tax Position — Sample Days → Average → nights × rate.
 */
export function OvernightClaimPanel({ provenance }: OvernightClaimPanelProps) {
  const empty =
    provenance.totalOvernights === 0 &&
    provenance.sampleDayCount === 0 &&
    provenance.totalClaimAud === 0

  return (
    <AppCard
      header={
        <SectionHeader
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/overnight">
                <MapPinned className="size-4" />
                Overnight planner
              </Link>
            </Button>
          }
          description="AJX Calculator parity — nights × daily amount, with sample-day averages when completed"
          title="Overseas overnight claim"
        />
      }
    >
      {empty ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            No overnight counts or sample days yet for this year. Enter nights by destination, then
            complete sample days to build an average.
          </p>
          <Button asChild size="sm">
            <Link to="/overnight">Start overnight planner</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric
              label="Qualifying overnights"
              value={formatNumber(provenance.totalOvernights)}
            />
            <Metric
              label="Sample days completed"
              value={formatNumber(provenance.completedSampleDayCount)}
            />
            <Metric
              emphasize
              label="Overnight claim"
              value={formatAud(provenance.totalClaimAud, 2)}
            />
          </div>

          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-3 text-sm">
            <p className="text-overline">Source</p>
            <p className="mt-1 text-muted-foreground">{provenance.source}</p>
            <p className="mt-2 text-overline">Calculation</p>
            <p className="mt-1 text-muted-foreground">{provenance.formula}</p>
            <p className="mt-2 font-medium tabular-nums text-foreground">
              → {formatAud(provenance.totalClaimAud, 2)}
            </p>
          </div>

          {provenance.overrideAud != null ? (
            <SoftBanner tone="warning">
              A year-level overseas daily override is applied ({formatAud(provenance.overrideAud, 2)}
              ). Calculated from nights × rates: {formatAud(provenance.calculatedClaimAud, 2)}.
            </SoftBanner>
          ) : null}

          {provenance.destinations.length > 0 ? (
            <ul className="space-y-2">
              {provenance.destinations.map((row) => (
                <li key={row.destinationId}>
                  <Link
                    className="flex flex-col gap-1 rounded-xl border border-border px-3 py-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                    to={`/overnight/${row.destinationId}`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{row.destinationName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(row.qualifyingOvernights)} nights ×{' '}
                        {formatAud(row.dailyRateAud, 2)}
                        {row.rateSource === 'sample_day_average'
                          ? ' (sample-day average)'
                          : ' (planner daily rate)'}
                        {row.sampleDaysCompleted > 0
                          ? ` · ${row.sampleDaysCompleted} completed sample day${row.sampleDaysCompleted === 1 ? '' : 's'}`
                          : ''}
                      </p>
                    </div>
                    <p className="shrink-0 font-display text-lg font-semibold tabular-nums">
                      {formatAud(row.claimAud, 2)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </AppCard>
  )
}

function Metric({
  label,
  value,
  emphasize,
}: {
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl px-4 py-3',
        emphasize
          ? 'border border-primary/25 bg-primary-soft/50 dark:bg-primary/10'
          : 'bg-muted/50',
      )}
    >
      <p className="text-overline">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  )
}
