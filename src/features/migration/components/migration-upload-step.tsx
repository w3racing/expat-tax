import { Upload } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { AppCard, Button, SoftBanner, UploadStatus } from '@/shared/components'
import type { ValidationResult } from '@/features/migration/types/import'
import { useState } from 'react'

type MigrationUploadStepProps = {
  error: string | null
  validation: ValidationResult | null
  onFile: (file: File) => void
}

export function MigrationUploadStep({ error, validation, onFile }: MigrationUploadStepProps) {
  const [pickedName, setPickedName] = useState<string | null>(null)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setPickedName(file.name)
      onFile(file)
    }
  }

  return (
    <AppCard
      header={
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Upload AJX Tax backup</h2>
          <p className="text-sm text-muted-foreground">
            Select your <span className="font-medium text-foreground">AJX Tax Backup.json</span>{' '}
            (<code className="text-xs">TaxPlannerState</code>, schema version 2). We validate
            structure before anything is written.
          </p>
        </div>
      }
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/60 px-6 py-12 text-center transition-colors hover:bg-muted">
        <span className="flex size-12 items-center justify-center rounded-lg bg-accent text-primary">
          <Upload aria-hidden className="size-5" />
        </span>
        <span className="text-sm font-semibold text-foreground">Choose JSON file</span>
        <span className="text-xs text-muted-foreground">application/json · .json</span>
        <input
          accept=".json,application/json"
          className="sr-only"
          onChange={handleChange}
          type="file"
        />
      </label>

      {pickedName ? (
        <div className="mt-4">
          <UploadStatus
            fileName={pickedName}
            phase={validation && !validation.ok ? 'failed' : validation?.ok ? 'ready' : 'uploading'}
          />
        </div>
      ) : null}

      {(error || (validation && !validation.ok)) && (
        <div className="mt-4 space-y-2">
          {error ? <SoftBanner tone="warning">{error}</SoftBanner> : null}
          {validation?.issues.map((issue) => (
            <SoftBanner key={`${issue.path}-${issue.message}`} tone="warning">
              <span className="font-mono text-xs">{issue.path}</span> — {issue.message}
            </SoftBanner>
          ))}
        </div>
      )}

      <SoftBanner className="mt-4" tone="info">
        Your existing Tax Position is never wiped. Import merges by original id and keeps rows that
        are not in the backup. A migration log and pre-import snapshot are always written.
      </SoftBanner>

      <div className="mt-6">
        <Button asChild variant="outline">
          <a href="/samples/ajx-tax-planner-sample.json" download>
            Download sample TaxPlannerState
          </a>
        </Button>
      </div>
    </AppCard>
  )
}
