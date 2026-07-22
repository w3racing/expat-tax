import type { ImportWritePlan } from '@/features/migration/types/import'
import {
  PLANNER_ADAPTER_ID,
} from '@/features/migration/types/import'
import {
  clearLastParsedPlanner,
  commitPlannerImport,
  getLastParsedPlanner,
  getLastReceiptFolders,
} from '@/features/migration/importers/ajx-planner-importer'
import {
  createEvidenceMigrationLogDraft,
  createPlannerMigrationLogDraft,
  upsertMigrationLog,
  snapshotPlannerBeforeImport,
  type MigrationLogEntry,
} from '@/features/migration/services/migration-log'
import { upsertImportedEvidenceRecord } from '@/features/evidence/services/evidence-vault'
import { readRawPlanner } from '@/shared/lib/local-data-store'

const STORAGE_KEY = 'ajx.migration.imported.v1'

export type ImportedRecordStore = {
  batchId: string
  importedAt: string
  provenanceLabel: string
  source: string
  migrationVersion: string
  employers: ImportWritePlan['employers']
  evidence: ImportWritePlan['evidence']
  payslips: ImportWritePlan['payslips']
  trips: ImportWritePlan['trips']
  claims: ImportWritePlan['claims']
  notes: ImportWritePlan['notes']
  tags: ImportWritePlan['tags']
  plannerYears?: number
  legacyIdMap: ImportWritePlan['legacyIdMap']
  receiptFoldersByFy?: Record<number, unknown[]>
}

function readStore(): ImportedRecordStore[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ImportedRecordStore[]
  } catch {
    return []
  }
}

function writeStore(batches: ImportedRecordStore[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(batches))
}

function fyEndFromLabel(label: string): number | null {
  const match = label.match(/(\d{4})/)
  if (!match) return null
  const start = Number(match[1])
  if (label.includes('–') || label.includes('-')) {
    return start + 1
  }
  return start
}

export type ImportProgressPhase = {
  label: string
  progress: number
}

/** Persists import plan: snapshot → merge Tax Position → migration log. */
export async function executeImportPlan(
  plan: ImportWritePlan,
  onPhase?: (phase: ImportProgressPhase) => void,
): Promise<ImportedRecordStore> {
  const report = (label: string, progress: number) => onPhase?.({ label, progress })

  let log: MigrationLogEntry =
    plan.adapterId === PLANNER_ADAPTER_ID
      ? createPlannerMigrationLogDraft({
          batchId: plan.batchId,
          sourceFilename: plan.sourceFilename,
          sourceChecksum: plan.sourceChecksum,
          sourceSchemaVersion: plan.sourceSchemaVersion ?? 2,
          counts: {
            claims: plan.claims.length,
            notes: plan.notes.length,
            legacyIds: plan.legacyIdMap.length,
          },
          warnings: plan.warnings,
          legacyIdMap: plan.legacyIdMap,
        })
      : createEvidenceMigrationLogDraft({
          batchId: plan.batchId,
          sourceFilename: plan.sourceFilename,
          sourceChecksum: plan.sourceChecksum,
          counts: {
            evidence: plan.evidence.length,
            employers: plan.employers.length,
            payslips: plan.payslips.length,
          },
          warnings: plan.warnings,
          legacyIdMap: plan.legacyIdMap,
        })

  log = { ...log, status: 'importing' }
  upsertMigrationLog(log)

  try {
    report('Snapshotting existing Tax Position…', 10)
    const snapshotId = snapshotPlannerBeforeImport(plan.batchId, readRawPlanner())
    log = { ...log, preImportSnapshotId: snapshotId }
    upsertMigrationLog(log)

    let plannerYears = 0
    const receiptFoldersByFy = getLastReceiptFolders()

    if (plan.adapterId === PLANNER_ADAPTER_ID) {
      report('Merging TaxPlannerState (preserving existing rows)…', 35)
      const planner = getLastParsedPlanner()
      if (!planner) {
        throw Object.assign(new Error('Parsed backup missing — re-upload the file'), {
          code: 'IMPORT_FAILED',
        })
      }
      commitPlannerImport(planner)
      plannerYears = planner.years.length
      clearLastParsedPlanner()
    }

    report('Writing evidence metadata…', 65)
    for (const item of plan.evidence) {
      upsertImportedEvidenceRecord({
        id: item.legacyId,
        fyEndYear: fyEndFromLabel(item.financialYear),
        title: item.title,
        category: item.type,
        description: item.merchant
          ? `Merchant: ${item.merchant}`
          : 'Imported from AJX Tax v1',
        fileName: item.fileName,
        mimeType: item.mimeType,
      })
    }

    report('Writing migration log…', 85)
    const record: ImportedRecordStore = {
      batchId: plan.batchId,
      importedAt: new Date().toISOString(),
      provenanceLabel: plan.provenanceLabel,
      source: plan.provenanceSource,
      migrationVersion: plan.migrationVersion,
      employers: plan.employers,
      evidence: plan.evidence,
      payslips: plan.payslips,
      trips: plan.trips,
      claims: plan.claims,
      notes: plan.notes,
      tags: plan.tags,
      plannerYears,
      legacyIdMap: plan.legacyIdMap,
      receiptFoldersByFy:
        Object.keys(receiptFoldersByFy).length > 0 ? receiptFoldersByFy : undefined,
    }

    const batches = readStore()
    batches.push(record)
    writeStore(batches)

    log = {
      ...log,
      status: 'completed',
      completedAt: new Date().toISOString(),
      counts: {
        ...log.counts,
        years: plannerYears,
        evidence: plan.evidence.length,
        claims: plan.claims.length,
        legacyIds: plan.legacyIdMap.length,
      },
      legacyIdMap: plan.legacyIdMap,
    }
    upsertMigrationLog(log)

    report('Done', 100)
    return record
  } catch (err) {
    upsertMigrationLog({
      ...log,
      status: 'failed',
      errorMessage: err instanceof Error ? err.message : 'Import failed',
      completedAt: new Date().toISOString(),
    })
    throw err
  }
}

export function buildExistingVaultIndexFromLocal() {
  const legacyIds = new Set<string>()
  const checksums = new Set<string>()
  const fuzzyKeys = new Set<string>()

  for (const batch of readStore()) {
    for (const employer of batch.employers) {
      legacyIds.add(employer.legacyId)
    }
    for (const item of batch.evidence) {
      legacyIds.add(item.legacyId)
      if (item.checksumSha256) checksums.add(item.checksumSha256)
      const date = item.occurredOn ?? ''
      const amount = item.amount != null ? item.amount.toFixed(2) : ''
      const merchant = (item.merchant ?? item.title).trim().toLowerCase()
      const key = `${date}|${amount}|${merchant}`
      if (key !== '||') fuzzyKeys.add(key)
    }
    for (const payslip of batch.payslips) legacyIds.add(payslip.legacyId)
    for (const trip of batch.trips) legacyIds.add(trip.legacyId)
    for (const claim of batch.claims) legacyIds.add(claim.legacyId)
    for (const map of batch.legacyIdMap ?? []) legacyIds.add(map.legacyId)
  }

  return { legacyIds, checksums, fuzzyKeys }
}
