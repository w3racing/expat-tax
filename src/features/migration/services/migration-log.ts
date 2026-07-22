import type {
  ImportWarning,
  LegacyIdMapEntry,
} from '@/features/migration/types/import'
import {
  AJX_PLANNER_PROVENANCE_LABEL,
  AJX_PLANNER_PROVENANCE_SOURCE,
  AJX_V1_PROVENANCE_LABEL,
  MIGRATION_VERSION,
  PLANNER_ADAPTER_CONTRACT_VERSION,
} from '@/features/migration/types/import'
import type { TaxPlannerState } from '@/features/tax-position/engine'

const LOG_KEY = 'ajx.migration.log.v1'
const SNAPSHOT_KEY = 'ajx.migration.snapshots.v1'

export type MigrationLogStatus = 'previewed' | 'importing' | 'completed' | 'failed'

export type MigrationLogEntry = {
  batchId: string
  status: MigrationLogStatus
  adapterId: string
  /** Machine provenance source */
  source: typeof AJX_PLANNER_PROVENANCE_SOURCE | 'ajx_tax_v1'
  provenanceLabel: string
  migrationVersion: string
  adapterContractVersion: string
  sourceFilename: string | null
  sourceChecksum: string | null
  sourceSchemaVersion: number | null
  createdAt: string
  completedAt: string | null
  errorMessage: string | null
  counts: Record<string, number>
  warnings: ImportWarning[]
  /** Original ids preserved */
  legacyIdMap: LegacyIdMapEntry[]
  /** Snapshot id for pre-import Tax Position (never lose data) */
  preImportSnapshotId: string | null
}

type SnapshotStore = Record<
  string,
  {
    id: string
    batchId: string
    createdAt: string
    planner: TaxPlannerState
  }
>

function readLog(): MigrationLogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    if (!raw) return []
    return JSON.parse(raw) as MigrationLogEntry[]
  } catch {
    return []
  }
}

function writeLog(entries: MigrationLogEntry[]) {
  localStorage.setItem(LOG_KEY, JSON.stringify(entries))
}

function readSnapshots(): SnapshotStore {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as SnapshotStore
  } catch {
    return {}
  }
}

function writeSnapshots(store: SnapshotStore) {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(store))
}

export function listMigrationLogs(): MigrationLogEntry[] {
  return readLog().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getMigrationLog(batchId: string): MigrationLogEntry | null {
  return readLog().find((e) => e.batchId === batchId) ?? null
}

export function listImportedChecksums(): Set<string> {
  const set = new Set<string>()
  for (const entry of readLog()) {
    if (entry.status === 'completed' && entry.sourceChecksum) {
      set.add(entry.sourceChecksum)
    }
  }
  return set
}

export function upsertMigrationLog(entry: MigrationLogEntry): void {
  const logs = readLog()
  const idx = logs.findIndex((e) => e.batchId === entry.batchId)
  if (idx >= 0) logs[idx] = entry
  else logs.unshift(entry)
  writeLog(logs)
}

/** Snapshot Tax Position before merge so data can be restored. */
export function snapshotPlannerBeforeImport(
  batchId: string,
  planner: TaxPlannerState | null,
): string | null {
  if (!planner) return null
  const id = crypto.randomUUID()
  const store = readSnapshots()
  store[id] = {
    id,
    batchId,
    createdAt: new Date().toISOString(),
    planner: structuredClone(planner),
  }
  writeSnapshots(store)
  return id
}

export function getPlannerSnapshot(snapshotId: string): TaxPlannerState | null {
  return readSnapshots()[snapshotId]?.planner ?? null
}

export function createPlannerMigrationLogDraft(input: {
  batchId: string
  sourceFilename: string | null
  sourceChecksum: string | null
  sourceSchemaVersion: number
  counts: Record<string, number>
  warnings: ImportWarning[]
  legacyIdMap: LegacyIdMapEntry[]
}): MigrationLogEntry {
  return {
    batchId: input.batchId,
    status: 'previewed',
    adapterId: 'ajx-calculator-tax-planner-v2',
    source: AJX_PLANNER_PROVENANCE_SOURCE,
    provenanceLabel: AJX_PLANNER_PROVENANCE_LABEL,
    migrationVersion: MIGRATION_VERSION,
    adapterContractVersion: PLANNER_ADAPTER_CONTRACT_VERSION,
    sourceFilename: input.sourceFilename,
    sourceChecksum: input.sourceChecksum,
    sourceSchemaVersion: input.sourceSchemaVersion,
    createdAt: new Date().toISOString(),
    completedAt: null,
    errorMessage: null,
    counts: input.counts,
    warnings: input.warnings,
    legacyIdMap: input.legacyIdMap,
    preImportSnapshotId: null,
  }
}

export function createEvidenceMigrationLogDraft(input: {
  batchId: string
  sourceFilename: string | null
  sourceChecksum: string | null
  counts: Record<string, number>
  warnings: ImportWarning[]
  legacyIdMap: LegacyIdMapEntry[]
}): MigrationLogEntry {
  return {
    batchId: input.batchId,
    status: 'previewed',
    adapterId: 'ajx-tax-v1',
    source: 'ajx_tax_v1',
    provenanceLabel: AJX_V1_PROVENANCE_LABEL,
    migrationVersion: MIGRATION_VERSION,
    adapterContractVersion: PLANNER_ADAPTER_CONTRACT_VERSION,
    sourceFilename: input.sourceFilename,
    sourceChecksum: input.sourceChecksum,
    sourceSchemaVersion: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    errorMessage: null,
    counts: input.counts,
    warnings: input.warnings,
    legacyIdMap: input.legacyIdMap,
    preImportSnapshotId: null,
  }
}
