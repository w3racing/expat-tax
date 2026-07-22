import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import {
  adminDisableMigrationWizard,
  adminReenableMigrationWizard,
  isMigrationWizardAvailable,
  readMigrationGate,
} from '@/features/migration/utils/migration-gate'
import { listMigrationLogs } from '@/features/migration/services/migration-log'
import { AppCard, Button, EmptyState, PageHeader, SoftBanner } from '@/shared/components'

export function MigrationAdminPage() {
  const [gate, setGate] = useState(readMigrationGate)
  const [tick, setTick] = useState(0)

  const refresh = () => {
    setGate(readMigrationGate())
    setTick((t) => t + 1)
  }

  const available = isMigrationWizardAvailable(gate)
  const logs = useMemo(() => {
    void tick
    return listMigrationLogs()
  }, [tick])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        description="Re-enable the wizard and review migration logs (source, version, original ids)."
        title="Migration controls"
      />

      <AppCard>
        <div className="space-y-4">
          <SoftBanner tone={available ? 'success' : 'info'}>
            Wizard is currently <strong>{available ? 'available' : 'disabled'}</strong>
            {gate.migrationCompletedAt
              ? ` · completed ${new Date(gate.migrationCompletedAt).toLocaleString()}`
              : ' · not completed yet'}
          </SoftBanner>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                adminReenableMigrationWizard()
                refresh()
              }}
            >
              Re-enable wizard
            </Button>
            <Button
              onClick={() => {
                adminDisableMigrationWizard()
                refresh()
              }}
              variant="outline"
            >
              Disable wizard
            </Button>
            <Button asChild variant="soft">
              <Link to="/migration">Open wizard</Link>
            </Button>
          </div>

          {gate.lastBatchId ? (
            <p className="font-mono text-xs text-muted-foreground">
              Last batch {gate.lastBatchId}
            </p>
          ) : null}
        </div>
      </AppCard>

      <AppCard
        header={<h2 className="text-lg font-semibold tracking-tight">Migration log</h2>}
      >
        {logs.length === 0 ? (
          <EmptyState
            description="Successful and failed imports appear here with source, migration version, and preserved original ids."
            title="No imports yet"
          />
        ) : (
          <ul className="space-y-3">
            {logs.map((entry) => (
              <li
                className="rounded-lg border border-border bg-muted/40 px-3 py-3 text-sm"
                key={entry.batchId}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold capitalize">{entry.status}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
                <dl className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                  <div>
                    <dt className="text-overline">Source</dt>
                    <dd className="font-mono text-foreground">{entry.source}</dd>
                  </div>
                  <div>
                    <dt className="text-overline">Migration version</dt>
                    <dd className="font-mono text-foreground">{entry.migrationVersion}</dd>
                  </div>
                  <div>
                    <dt className="text-overline">File</dt>
                    <dd className="text-foreground">{entry.sourceFilename ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-overline">Original ids</dt>
                    <dd className="text-foreground">{entry.legacyIdMap.length}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-overline">Batch</dt>
                    <dd className="font-mono text-foreground">{entry.batchId}</dd>
                  </div>
                  {entry.preImportSnapshotId ? (
                    <div className="sm:col-span-2">
                      <dt className="text-overline">Pre-import snapshot</dt>
                      <dd className="font-mono text-foreground">{entry.preImportSnapshotId}</dd>
                    </div>
                  ) : null}
                  {entry.errorMessage ? (
                    <div className="sm:col-span-2 text-destructive">{entry.errorMessage}</div>
                  ) : null}
                </dl>
              </li>
            ))}
          </ul>
        )}
      </AppCard>
    </div>
  )
}
