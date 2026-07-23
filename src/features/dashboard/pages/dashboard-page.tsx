import { PageHeader } from '@/shared/components/ajx/page-header'
import { FySelect } from '@/shared/components/ajx/fy-select'
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

export function DashboardPage() {
  const { label } = useFy()
  const { snapshot, loading } = useDashboardSnapshot()

  if (loading) {
    return <PageSkeleton cards={5} />
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        actions={<FySelect />}
        description="A clear view of where you stand — estimate, overseas claim, evidence, and what to do next."
        title="Home"
      />

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-overline">Current financial year</p>
        <p className="font-display text-lg font-semibold tracking-tight text-foreground">{label}</p>
      </div>

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
