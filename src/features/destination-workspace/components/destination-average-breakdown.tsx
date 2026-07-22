import { Link } from 'react-router-dom'
import type { DestinationAverageCalculation } from '@/features/destination-workspace/utils/destination-average-calc'
import { AppCard } from '@/shared/components/ajx/app-card'
import { SectionHeader } from '@/shared/components/ajx/section-header'
import { formatAud, formatNumber } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'

type DestinationAverageBreakdownProps = {
  calc: DestinationAverageCalculation
  destinationId: string
}

/**
 * Traceable display: Sample Days → Average → Calculation → Final Claim.
 * Every figure shows source and formula (U11–U12).
 */
export function DestinationAverageBreakdown({
  calc,
  destinationId,
}: DestinationAverageBreakdownProps) {
  return (
    <div className="space-y-4">
      <SectionHeader
        description="Every figure shows where it comes from — same maths as AJX Calculator"
        title="How your claim is calculated"
      />

      {/* 1. Sample Days */}
      <AppCard className="space-y-3">
        <StepHeading
          index={1}
          title="Sample Days"
          subtitle={`${calc.sampleDaysCompleted} completed · ${calc.sampleDaysInProgress} in progress`}
        />
        {calc.sampleDayContributions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sample days yet.{' '}
            <Link
              className="font-medium text-primary underline-offset-2 hover:underline"
              to={`/overnight/${destinationId}/sample-days`}
            >
              Create a sample day
            </Link>{' '}
            to build an average.
          </p>
        ) : (
          <ul className="space-y-2">
            {calc.sampleDayContributions.map((day) => (
              <li
                key={day.id}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-sm',
                  day.includedInAverage
                    ? 'border-success/30 bg-success-soft/30'
                    : 'border-border bg-muted/30',
                )}
              >
                <div className="min-w-0">
                  <Link
                    className="font-medium text-foreground underline-offset-2 hover:underline"
                    to={`/overnight/${destinationId}/sample-days/${day.id}`}
                  >
                    {day.label}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {day.status === 'complete' ? 'Included in average' : 'Not included yet'} ·{' '}
                    {day.receiptCount} receipt{day.receiptCount === 1 ? '' : 's'}
                  </p>
                </div>
                <p className="shrink-0 font-display font-semibold tabular-nums">
                  {formatAud(day.totalAud, 2)}
                </p>
              </li>
            ))}
          </ul>
        )}
        {calc.sampleDaysCompleted > 0 ? (
          <TraceLine
            label="Sum of completed days"
            formula={calc.steps[0]?.calculation ?? ''}
            result={formatAud(calc.totalSampleDaysAud, 2)}
          />
        ) : null}
      </AppCard>

      {/* 2. Average */}
      <AppCard className="space-y-3">
        <StepHeading index={2} title="Average" subtitle="Average daily spend · Average AUD value" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric
            label="Average daily spend"
            value={
              calc.averageDailySpendAud != null
                ? formatAud(calc.averageDailySpendAud, 2)
                : '—'
            }
            hint="AUD per typical overnight"
          />
          <Metric
            label="Average AUD value"
            value={
              calc.averageAudValue != null ? formatAud(calc.averageAudValue, 2) : '—'
            }
            hint="Same figure — all receipts converted to AUD"
          />
        </div>
        <TraceLine
          label="Formula"
          formula={
            calc.averageDailySpendAud != null
              ? `${formatAud(calc.totalSampleDaysAud, 2)} ÷ ${calc.sampleDaysCompleted} completed day${calc.sampleDaysCompleted === 1 ? '' : 's'}`
              : 'Sum of completed day totals ÷ number of completed days'
          }
          result={
            calc.averageDailySpendAud != null
              ? formatAud(calc.averageDailySpendAud, 2)
              : 'Not calculated yet'
          }
        />
      </AppCard>

      {/* 3. Calculation */}
      <AppCard className="space-y-3">
        <StepHeading
          index={3}
          title="Calculation"
          subtitle="Qualifying overnights × daily amount"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            label="Qualifying overnights"
            value={formatNumber(calc.qualifyingOvernights)}
            hint="From overnight planner"
          />
          <Metric
            label="Daily amount used"
            value={formatAud(calc.appliedDailyRateAud, 2)}
            hint={
              calc.rateSource === 'sample_day_average'
                ? 'From sample-day average'
                : 'Planner daily rate (no completed sample days)'
            }
          />
          <Metric
            label="Destination claim"
            value={formatAud(calc.destinationClaimAud, 2)}
            hint="Overnights × daily amount"
            emphasize
          />
        </div>
        <TraceLine
          label="Formula"
          formula={`${formatNumber(calc.qualifyingOvernights)} × ${formatAud(calc.appliedDailyRateAud, 2)}`}
          result={formatAud(calc.destinationClaimAud, 2)}
        />
      </AppCard>

      {/* 4. Final Claim */}
      <AppCard className="space-y-3 border-primary/25 bg-primary-soft/40 dark:bg-primary/10">
        <StepHeading index={4} title="Final Claim" subtitle="What appears in Tax Position" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric
            label={`${calc.destinationName} claim`}
            value={formatAud(calc.destinationClaimAud, 2)}
            hint="This destination"
            emphasize
          />
          <Metric
            label="Financial year overnight claim"
            value={formatAud(calc.financialYearClaimAud, 2)}
            hint="All destinations · Σ (nights × rate)"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Engine {calc.engineVersion}. Completing a sample day recalculates average, destination
          claim, and financial year claim automatically.
        </p>
      </AppCard>
    </div>
  )
}

function StepHeading({
  index,
  title,
  subtitle,
}: {
  index: number
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {index}
      </span>
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

function Metric({
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
      className={cn(
        'rounded-xl border px-3 py-3',
        emphasize ? 'border-primary/30 bg-card' : 'border-border bg-muted/30',
      )}
    >
      <p className="text-overline">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function TraceLine({
  label,
  formula,
  result,
}: {
  label: string
  formula: string
  result: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background/80 px-3 py-3 text-sm">
      <p className="text-overline">{label}</p>
      <p className="mt-1 text-muted-foreground">{formula}</p>
      <p className="mt-1 font-medium tabular-nums text-foreground">→ {result}</p>
    </div>
  )
}
