import { Link } from 'react-router-dom'
import { AppCard, Button, SoftBanner } from '@/shared/components'

type MigrationCompleteStepProps = {
  batchId: string
  counts: Record<string, number>
  source: string
  migrationVersion: string
  provenanceLabel: string
}

export function MigrationCompleteStep({
  batchId,
  counts,
  source,
  migrationVersion,
  provenanceLabel,
}: MigrationCompleteStepProps) {
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0)

  return (
    <div className="space-y-4">
      <AppCard>
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold tracking-tight">Migration complete</h2>
          <p className="text-sm text-muted-foreground">
            {total} mapped records processed. Marked as {provenanceLabel}.
          </p>
          <SoftBanner tone="success">
            Migration log saved. Pre-import Tax Position snapshot retained. Wizard disabled by
            default — re-enable from settings if you need another import.
          </SoftBanner>
          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-overline">Source</dt>
              <dd className="mt-0.5 font-mono text-foreground">{source}</dd>
            </div>
            <div>
              <dt className="text-overline">Migration version</dt>
              <dd className="mt-0.5 font-mono text-foreground">{migrationVersion}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-overline">Batch</dt>
              <dd className="mt-0.5 font-mono text-foreground">{batchId}</dd>
            </div>
          </dl>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(counts)
              .filter(([, count]) => count > 0)
              .map(([key, count]) => (
                <div className="rounded-lg border border-border bg-muted/50 px-3 py-3" key={key}>
                  <p className="text-overline">{key}</p>
                  <p className="font-display text-xl font-semibold">{count}</p>
                </div>
              ))}
          </div>
        </div>
      </AppCard>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/position">Open Tax Position</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Dashboard</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/settings/migration">Admin / logs</Link>
        </Button>
      </div>
    </div>
  )
}
