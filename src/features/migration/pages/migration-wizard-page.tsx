import { MotionConfig } from 'framer-motion'
import { Navigate } from 'react-router-dom'
import { MigrationCompleteStep } from '@/features/migration/components/migration-complete-step'
import { MigrationDuplicatesStep } from '@/features/migration/components/migration-duplicates-step'
import { MigrationImportingStep } from '@/features/migration/components/migration-importing-step'
import { MigrationPreviewStep } from '@/features/migration/components/migration-preview-step'
import { MigrationUploadStep } from '@/features/migration/components/migration-upload-step'
import { useMigrationWizard } from '@/features/migration/hooks/use-migration-wizard'
import { isMigrationWizardAvailable } from '@/features/migration/utils/migration-gate'
import { PageHeader, SoftBanner } from '@/shared/components'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { ErrorBanner } from '@/shared/components/ui/error-banner'
import { mapUnknownError } from '@/shared/lib/errors'

export function MigrationWizardPage() {
  const wizard = useMigrationWizard()

  if (!isMigrationWizardAvailable(wizard.gate) && wizard.step === 'upload') {
    return <Navigate replace to="/settings/migration" />
  }

  const skippedCount = Object.values(wizard.decisions).filter((d) => d === 'skip').length
  const mappedError = wizard.error
    ? mapUnknownError(Object.assign(new Error(wizard.error), { code: 'IMPORT_FAILED' }))
    : null

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          description="Import an AJX Tax Backup.json (TaxPlannerState). Validate, preview, review warnings, then confirm — existing data is merged, never wiped."
          title="Import wizard"
        />

        <SoftBanner tone="info">
          Source is preserved as <code className="text-xs">ajx_calculator_tax_planner_v2</code> with
          original entity ids and migration version{' '}
          <code className="text-xs">mvp-planner-1.0.0</code>.
        </SoftBanner>

        {wizard.error && wizard.step !== 'upload' ? (
          <ErrorBanner code={mappedError?.code === 'IMPORT_UNSUPPORTED' ? 'IMPORT_UNSUPPORTED' : 'IMPORT_FAILED'} />
        ) : null}

        <div>
          {wizard.step === 'upload' ? (
            <MigrationUploadStep
              error={wizard.error}
              onFile={wizard.loadFile}
              validation={wizard.validation}
            />
          ) : null}

          {wizard.step === 'duplicates' && wizard.duplicates ? (
            <MigrationDuplicatesStep
              decisions={wizard.decisions}
              duplicates={wizard.duplicates}
              onBack={wizard.reset}
              onContinue={wizard.continueFromDuplicates}
              onDecision={wizard.setDecision}
              onSkipAllExact={wizard.skipAllExact}
            />
          ) : null}

          {wizard.step === 'preview' && wizard.preview && wizard.fileName ? (
            <MigrationPreviewStep
              fileName={wizard.fileName}
              onBack={() =>
                wizard.duplicates && wizard.duplicates.matches.length > 0
                  ? wizard.setStep('duplicates')
                  : wizard.reset()
              }
              onImport={wizard.requestImport}
              preview={wizard.preview}
              skippedCount={skippedCount}
              warnings={wizard.warnings}
            />
          ) : null}

          {wizard.step === 'importing' ? (
            <MigrationImportingStep phase={wizard.importPhase} />
          ) : null}

          {wizard.step === 'complete' && wizard.importResult ? (
            <MigrationCompleteStep
              batchId={wizard.importResult.batchId}
              counts={wizard.importResult.counts}
              migrationVersion={wizard.importResult.migrationVersion}
              provenanceLabel={wizard.importResult.provenanceLabel}
              source={wizard.importResult.source}
            />
          ) : null}
        </div>

        <ConfirmDialog
          confirmLabel="Import backup"
          description="We’ll snapshot your current Tax Position, merge this backup by original id, recompute summaries, and write a migration log. Existing rows not in the file are kept."
          open={wizard.confirmOpen}
          title="Confirm import?"
          typingGate="IMPORT"
          onCancel={() => wizard.setConfirmOpen(false)}
          onConfirm={() => void wizard.runImport()}
        />
      </div>
    </MotionConfig>
  )
}
