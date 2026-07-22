import { Link } from 'react-router-dom'
import { FileStack, Globe2, PiggyBank, Receipt, TrendingDown, TrendingUp } from 'lucide-react'
import type { DashboardSnapshot } from '@/features/dashboard/types/snapshot'
import { DashboardCard } from '@/shared/components/ajx/dashboard-card'
import { ReadinessRing } from '@/shared/components/ajx/readiness-ring'
import { Sparkline } from '@/shared/components/ajx/charts'
import { Button } from '@/shared/components/ui/button'
import { formatAud, formatNumber } from '@/shared/lib/format'

type DashboardMetricsProps = {
  snapshot: DashboardSnapshot
}

export function DashboardMetrics({ snapshot }: DashboardMetricsProps) {
  const estimateLabel = !snapshot.estimateAvailable
    ? 'Estimated tax position'
    : snapshot.isRefundStance
      ? 'Estimated refund'
      : 'Estimated tax payable'

  const estimateValue = !snapshot.estimateAvailable
    ? '—'
    : formatAud(Math.abs(snapshot.estimatedTaxAud), 0)

  const estimateHint = !snapshot.estimateAvailable
    ? 'Add income or claims to see an indicative position'
    : snapshot.isRefundStance
      ? `${snapshot.fyLabel} · Indicative — not lodgement advice`
      : `${snapshot.fyLabel} · Indicative — not lodgement advice`

  const sparkValues =
    snapshot.incomeByMonth.length >= 2
      ? snapshot.incomeByMonth.map((m) => m.value)
      : snapshot.totalIncomeAud > 0
        ? [0, snapshot.totalIncomeAud * 0.35, snapshot.totalIncomeAud * 0.7, snapshot.totalIncomeAud]
        : []

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardCard
        chart={
          sparkValues.length >= 2 ? (
            <Sparkline
              label="Income trajectory across the year"
              values={sparkValues.map((v) => Math.max(0, v))}
            />
          ) : undefined
        }
        className="sm:col-span-2 xl:col-span-2"
        emphasis="hero"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {snapshot.estimateAvailable
                ? `Taxable ${formatAud(snapshot.summary?.taxableIncomeAud ?? 0, 0)}`
                : 'Working paper for this financial year'}
            </p>
            <Button asChild size="sm" variant="soft">
              <Link to="/position/summary">View tax summary</Link>
            </Button>
          </div>
        }
        hint={estimateHint}
        icon={
          snapshot.isRefundStance ? (
            <TrendingDown className="size-5" />
          ) : (
            <TrendingUp className="size-5" />
          )
        }
        label={estimateLabel}
        tone={
          !snapshot.estimateAvailable
            ? 'neutral'
            : snapshot.isRefundStance
              ? 'positive'
              : 'attention'
        }
        value={estimateValue}
      />

      <DashboardCard
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {formatNumber(snapshot.qualifyingOvernights)} qualifying overnight
              {snapshot.qualifyingOvernights === 1 ? '' : 's'}
            </p>
            <Button asChild size="sm" variant="ghost">
              <Link to="/overnight">Overnight planner</Link>
            </Button>
          </div>
        }
        hint="Nights × daily amount · Calculator parity"
        icon={<Globe2 className="size-5" />}
        label="Total overseas claim"
        tone="primary"
        value={formatAud(snapshot.overseasClaimAud, 0)}
      />

      <DashboardCard
        footer={
          <p className="text-xs text-muted-foreground">
            Employment {formatAud(snapshot.employmentIncomeAud, 0)}
            {snapshot.investmentIncomeAud > 0
              ? ` · Investments ${formatAud(snapshot.investmentIncomeAud, 0)}`
              : ''}
          </p>
        }
        hint="Employment and investments"
        icon={<PiggyBank className="size-5" />}
        label="Income"
        value={formatAud(snapshot.totalIncomeAud, 0)}
      />

      <DashboardCard
        footer={
          <p className="text-xs text-muted-foreground">
            Overseas {formatAud(snapshot.overseasClaimAud, 0)}
            {snapshot.workExpensesAud > 0
              ? ` · Other ${formatAud(snapshot.workExpensesAud, 0)}`
              : ''}
          </p>
        }
        hint="Claims and deductions this year"
        icon={<Receipt className="size-5" />}
        label="Deductions"
        value={formatAud(snapshot.totalDeductionsAud, 0)}
      />

      <DashboardCard
        chart={
          <div className="flex items-center gap-4">
            <ReadinessRing
              label="Evidence completeness"
              score={snapshot.completenessPercent}
              size={88}
            />
            <div className="min-w-0 space-y-1 text-sm text-muted-foreground">
              <p>
                {snapshot.evidenceCount} document{snapshot.evidenceCount === 1 ? '' : 's'}
              </p>
              <p>
                {snapshot.sampleDaysCompleted} sample day
                {snapshot.sampleDaysCompleted === 1 ? '' : 's'} completed
              </p>
            </div>
          </div>
        }
        className="sm:col-span-2"
        footer={
          <Button asChild size="sm" variant="ghost">
            <Link to="/evidence">Open evidence vault</Link>
          </Button>
        }
        hint="Income · overnights · claim · sample days · documents"
        icon={<FileStack className="size-5" />}
        label="Evidence completeness"
        value={`${snapshot.completenessPercent}%`}
      />
    </div>
  )
}
