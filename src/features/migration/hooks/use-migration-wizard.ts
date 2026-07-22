import { useCallback, useMemo, useState } from 'react'
import {
  buildExistingVaultIndexFromLocal,
  executeImportPlan,
} from '@/features/migration/api/local-import-store'
import {
  getImportAdapter,
  resolveAdapterForContent,
} from '@/features/migration/importers/registry'
import {
  getLastParsedPlanner,
  getLastReceiptFolders,
} from '@/features/migration/importers/ajx-planner-importer'
import { sha256Hex } from '@/features/migration/utils/checksum'
import { analyzePlannerWarnings } from '@/features/migration/utils/planner-warnings'
import { listImportedChecksums } from '@/features/migration/services/migration-log'
import {
  markMigrationCompleted,
  readMigrationGate,
} from '@/features/migration/utils/migration-gate'
import {
  PLANNER_ADAPTER_ID,
  type CanonicalImportBundle,
  type DuplicateDecision,
  type DuplicateReport,
  type ImportWarning,
  type ImportWritePlan,
  type PreviewSummary,
  type ValidationResult,
} from '@/features/migration/types/import'

export type WizardStep = 'upload' | 'preview' | 'duplicates' | 'importing' | 'complete'

export function useMigrationWizard() {
  const [step, setStep] = useState<WizardStep>('upload')
  const [fileName, setFileName] = useState<string | null>(null)
  const [sourceChecksum, setSourceChecksum] = useState<string | null>(null)
  const [adapterId, setAdapterId] = useState<string | null>(null)
  const [bundle, setBundle] = useState<CanonicalImportBundle | null>(null)
  const [preview, setPreview] = useState<PreviewSummary | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [warnings, setWarnings] = useState<ImportWarning[]>([])
  const [duplicates, setDuplicates] = useState<DuplicateReport | null>(null)
  const [decisions, setDecisions] = useState<Record<string, DuplicateDecision>>({})
  const [error, setError] = useState<string | null>(null)
  const [writePlan, setWritePlan] = useState<ImportWritePlan | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [importPhase, setImportPhase] = useState<{ label: string; progress: number } | null>(
    null,
  )
  const [importResult, setImportResult] = useState<{
    batchId: string
    counts: Record<string, number>
    source: string
    migrationVersion: string
    provenanceLabel: string
  } | null>(null)

  const gate = useMemo(() => readMigrationGate(), [importResult, step])

  const reset = useCallback(() => {
    setStep('upload')
    setFileName(null)
    setSourceChecksum(null)
    setAdapterId(null)
    setBundle(null)
    setPreview(null)
    setValidation(null)
    setWarnings([])
    setDuplicates(null)
    setDecisions({})
    setError(null)
    setWritePlan(null)
    setConfirmOpen(false)
    setImportPhase(null)
    setImportResult(null)
  }, [])

  const loadFile = useCallback(async (file: File) => {
    setError(null)

    try {
      const text = await file.text()
      const checksum = await sha256Hex(text)
      const adapter = await resolveAdapterForContent(file, text)
      if (!adapter) {
        setError('Unsupported file. Use an AJX Tax Backup.json (TaxPlannerState) export.')
        return
      }
      const nextBundle = adapter.parse(text)
      const nextValidation = adapter.validate(nextBundle)
      setFileName(file.name)
      setSourceChecksum(checksum)
      setAdapterId(adapter.id)
      setBundle(nextBundle)
      setValidation(nextValidation)

      if (!nextValidation.ok) {
        setWarnings(nextValidation.warnings)
        setStep('upload')
        return
      }

      let nextPreview = adapter.preview(nextBundle)
      if (adapter.id === PLANNER_ADAPTER_ID) {
        const planner = getLastParsedPlanner()
        if (planner) {
          const plannerWarnings = analyzePlannerWarnings(planner, {
            sourceChecksum: checksum,
            alreadyImportedChecksums: listImportedChecksums(),
            receiptFoldersByFy: getLastReceiptFolders(),
          })
          nextPreview = { ...nextPreview, warnings: plannerWarnings }
        }
      }

      const existing = buildExistingVaultIndexFromLocal()
      const nextDuplicates = adapter.detectDuplicates(nextBundle, existing)
      const initialDecisions: Record<string, DuplicateDecision> = {}
      for (const match of nextDuplicates.matches) {
        initialDecisions[match.legacyId] = match.method === 'fuzzy' ? 'import' : 'skip'
      }

      setPreview(nextPreview)
      setWarnings(nextPreview.warnings)
      setDuplicates(nextDuplicates)
      setDecisions(initialDecisions)
      setStep(nextDuplicates.matches.length > 0 ? 'duplicates' : 'preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read backup file')
    }
  }, [])

  const setDecision = useCallback((legacyId: string, decision: DuplicateDecision) => {
    setDecisions((prev) => ({ ...prev, [legacyId]: decision }))
  }, [])

  const skipAllExact = useCallback(() => {
    if (!duplicates) return
    setDecisions((prev) => {
      const next = { ...prev }
      for (const match of duplicates.matches) {
        if (match.method !== 'fuzzy') next[match.legacyId] = 'skip'
      }
      return next
    })
  }, [duplicates])

  const continueFromDuplicates = useCallback(() => {
    setStep('preview')
  }, [])

  const requestImport = useCallback(() => {
    setConfirmOpen(true)
  }, [])

  const runImport = useCallback(async () => {
    if (!bundle || !adapterId) return
    const adapter = getImportAdapter(adapterId)
    if (!adapter) {
      setError('Import adapter is no longer available')
      return
    }

    setConfirmOpen(false)
    const batchId = crypto.randomUUID()
    const plan = adapter.toWritePlan(bundle, decisions, batchId, {
      sourceFilename: fileName,
      sourceChecksum,
    })
    setWritePlan(plan)
    setStep('importing')
    setImportPhase({ label: 'Starting…', progress: 5 })

    try {
      const result = await executeImportPlan(plan, setImportPhase)
      markMigrationCompleted(result.batchId)
      setImportResult({
        batchId: result.batchId,
        source: result.source,
        migrationVersion: result.migrationVersion,
        provenanceLabel: result.provenanceLabel,
        counts: {
          years: result.plannerYears ?? 0,
          claims: result.claims.length,
          evidence: result.evidence.length,
          employers: result.employers.length,
          payslips: result.payslips.length,
          trips: result.trips.length,
          notes: result.notes.length,
          legacyIds: result.legacyIdMap.length,
        },
      })
      setImportPhase(null)
      setStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
      setImportPhase(null)
      setStep('preview')
    }
  }, [adapterId, bundle, decisions, fileName, sourceChecksum])

  return {
    step,
    fileName,
    sourceChecksum,
    bundle,
    preview,
    validation,
    warnings,
    duplicates,
    decisions,
    error,
    writePlan,
    confirmOpen,
    setConfirmOpen,
    importPhase,
    importResult,
    gate,
    loadFile,
    setDecision,
    skipAllExact,
    continueFromDuplicates,
    requestImport,
    runImport,
    reset,
    setStep,
  }
}
