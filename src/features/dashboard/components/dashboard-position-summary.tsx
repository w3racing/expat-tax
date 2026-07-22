import { Link } from 'react-router-dom'
import type { DashboardSnapshot } from '@/features/dashboard/types/snapshot'
import { AppCard } from '@/shared/components/ajx/app-card'
import { SectionHeader } from '@/shared/components/ajx/section-header'
import { SoftBanner } from '@/shared/components/ajx/soft-banner'
import { Button } from '@/shared/components/ui/button'
import { formatAud } from '@/shared/lib/format'

type DashboardPositionSummaryProps = {
  snapshot: DashboardSnapshot
}

export function DashboardPositionSummary({ snapshot }: DashboardPositionSummaryProps) {
  const taxable = snapshot.summary?.taxableIncomeAud ?? 0
  const medicare = snapshot.summary?.medicareLevyAud ?? 0
  const offsets = snapshot.summary?.taxOffsetsAud ?? 0

  return (
    <AppCard
      header={
        <SectionHeader
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/position">Open position</Link>
            </Button>
          }
          description="How the estimate is built — calm, not a spreadsheet"
          title="Position at a glance"
        />
      }
    >
      <SoftBanner className="mb-4" tone="info">
        Indicative only. AJX Tax does not lodge returns or give personalised tax advice.
      </SoftBanner>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Taxable income" value={formatAud(taxable, 0)} />
        <Metric label="Overseas claim" value={formatAud(snapshot.overseasClaimAud, 0)} emphasize />
        <Metric label="Tax offsets" value={formatAud(offsets, 0)} />
        <Metric label="Medicare levy" value={formatAud(medicare, 0)} />
      </dl>
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
      className={
        emphasize
          ? 'rounded-2xl border border-primary/25 bg-primary-soft/50 px-4 py-4 dark:bg-primary/10'
          : 'rounded-2xl bg-muted/50 px-4 py-4'
      }
    >
      <dt className="text-overline">{label}</dt>
      <dd className="mt-1.5 font-display text-xl font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  )
}
