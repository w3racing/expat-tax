import { PageHeader } from '@/shared/components/ajx/page-header'
import { FyChip } from '@/shared/components/ajx/fy-chip'
import { PageSkeleton } from '@/shared/components/ajx/loading-states'
import { SoftBanner } from '@/shared/components/ajx/soft-banner'
import { useFy } from '@/app/providers/fy-provider'
import { useDashboardSnapshot } from '@/features/dashboard/hooks/use-dashboard-snapshot'
import {
  DashboardRecentSampleDays,
  DashboardRecentUploads,
} from '@/features/dashboard/components/dashboard-activity'
import { DashboardEmpty } from '@/features/dashboard/components/dashboard-empty'
import { DashboardMetrics } from '@/features/dashboard/components/dashboard-metrics'
import { DashboardMissing } from '@/features/dashboard/components/dashboard-missing'
import { DashboardPositionSummary } from '@/features/dashboard/components/dashboard-position-summary'
import { DashboardQuickActions } from '@/features/dashboard/components/dashboard-quick-actions'

export function DashboardPage() {
  const { fyEndYear, cycleFy, label } = useFy()
  const { snapshot, loading } = useDashboardSnapshot()
  const fyShort = `${fyEndYear - 1}–${String(fyEndYear).slice(2)}`

  if (loading) {
    return <PageSkeleton cards={5} />
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        actions={
          <button
            aria-label={`Financial year ${label}. Activate to cycle years.`}
            className="touch-target"
            type="button"
            onClick={cycleFy}
          >
            <FyChip financialYear={fyShort} />
          </button>
        }
        description="A clear view of where you stand — estimate, overseas claim, evidence, and what to do next."
        title="Home"
      />

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-overline">Current financial year</p>
        <p className="font-display text-lg font-semibold tracking-tight text-foreground">{label}</p>
      </div>

      <DashboardQuickActions />

      {snapshot.isEmpty ? (
        <DashboardEmpty fyLabel={label} />
      ) : (
        <>
          <SoftBanner tone="info">
            Figures are indicative working papers for {label} — not lodgement advice.
          </SoftBanner>

          <DashboardMetrics snapshot={snapshot} />
          <DashboardPositionSummary snapshot={snapshot} />

          <div className="grid gap-4 lg:grid-cols-2">
            <DashboardRecentUploads items={snapshot.recentUploads} />
            <DashboardRecentSampleDays items={snapshot.recentSampleDays} />
          </div>

          <DashboardMissing items={snapshot.missing} />
        </>
      )}
    </div>
  )
}
