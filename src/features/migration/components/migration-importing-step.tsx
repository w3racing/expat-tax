import { AppCard, SoftBanner } from '@/shared/components'
import { JobProgress } from '@/shared/components/ui/job-progress'

type MigrationImportingStepProps = {
  phase: { label: string; progress: number } | null
}

export function MigrationImportingStep({ phase }: MigrationImportingStepProps) {
  return (
    <AppCard>
      <div className="space-y-4 py-4">
        <div className="text-center">
          <h2 className="font-display text-xl font-semibold tracking-tight">Importing</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Snapshotting your position, merging TaxPlannerState, and writing the migration log…
          </p>
        </div>
        <JobProgress
          label="Import progress"
          phase={phase?.label}
          value={phase?.progress ?? 0}
        />
        <SoftBanner tone="info">
          Original ids, source, and migration version are recorded. Existing AJX Tax rows that are
          not in the backup stay put.
        </SoftBanner>
      </div>
    </AppCard>
  )
}
