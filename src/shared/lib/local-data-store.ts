import type { TaxPlannerState, TaxYearSummary } from '@/features/tax-position/engine'
import { emptyPlanner, summarizeFromPlanner } from '@/features/tax-position/engine'
import { mergePlannerStates } from '@/features/migration/utils/merge-planner'

const POSITION_KEY = 'ajx.position.v1'
const EVIDENCE_KEY = 'ajx.evidence.v1'
const EXPORT_KEY = 'ajx.exports.v1'

export type EvidenceItem = {
  id: string
  fyEndYear: number | null
  title: string
  category: string | null
  tags: string[]
  processingStatus: 'queued' | 'ready' | 'failed'
  notes: string
  fileName?: string
  mimeType?: string
  dataUrl?: string
  softDeletedAt?: string | null
  createdAt: string
  updatedAt: string
  linkedClaimId?: string | null
}

export type ExportJobRecord = {
  id: string
  fyEndYear: number
  status: 'queued' | 'running' | 'ready' | 'failed'
  createdAt: string
  completedAt?: string
  errorMessage?: string
  fileName?: string
}

type PositionStore = {
  planner: TaxPlannerState
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadPlanner(fyEndYear: number): TaxPlannerState {
  const store = readJson<PositionStore | null>(POSITION_KEY, null)
  if (!store?.planner) {
    return emptyPlanner(fyEndYear)
  }
  if (!store.planner.years.some((y) => y.fyEndYear === fyEndYear)) {
    store.planner.years.push(emptyPlanner(fyEndYear).years[0]!)
    store.planner.activeFyEndYear = fyEndYear
    writeJson(POSITION_KEY, store)
  }
  return store.planner
}

export function savePlanner(planner: TaxPlannerState): TaxYearSummary | null {
  writeJson(POSITION_KEY, { planner } satisfies PositionStore)
  return summarizeFromPlanner(planner, planner.activeFyEndYear)
}

export function getSummary(fyEndYear: number): TaxYearSummary | null {
  const planner = loadPlanner(fyEndYear)
  return summarizeFromPlanner(planner, fyEndYear)
}

/**
 * Merge imported TaxPlannerState into existing position.
 * Existing claim / income rows that are absent from the backup are kept.
 */
export function importPlannerState(incoming: TaxPlannerState): TaxYearSummary | null {
  const existing = readJson<PositionStore | null>(POSITION_KEY, null)?.planner ?? null
  return savePlanner(mergePlannerStates(existing, incoming))
}

/** Persist an already-merged planner (used after snapshot + merge in migration). */
export function replacePlannerState(planner: TaxPlannerState): TaxYearSummary | null {
  return savePlanner(planner)
}

export function readRawPlanner(): TaxPlannerState | null {
  return readJson<PositionStore | null>(POSITION_KEY, null)?.planner ?? null
}

export function listEvidence(fyEndYear?: number): EvidenceItem[] {
  const items = readJson<EvidenceItem[]>(EVIDENCE_KEY, [])
  return items
    .filter((i) => !i.softDeletedAt)
    .filter((i) => (fyEndYear == null ? true : i.fyEndYear == null || i.fyEndYear === fyEndYear))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function upsertEvidence(item: EvidenceItem): void {
  const items = readJson<EvidenceItem[]>(EVIDENCE_KEY, [])
  const idx = items.findIndex((i) => i.id === item.id)
  if (idx >= 0) items[idx] = item
  else items.unshift(item)
  writeJson(EVIDENCE_KEY, items)
}

export function softDeleteEvidence(id: string): EvidenceItem | null {
  const items = readJson<EvidenceItem[]>(EVIDENCE_KEY, [])
  const item = items.find((i) => i.id === id)
  if (!item) return null
  item.softDeletedAt = new Date().toISOString()
  item.updatedAt = item.softDeletedAt
  writeJson(EVIDENCE_KEY, items)
  return item
}

export function restoreEvidence(id: string): void {
  const items = readJson<EvidenceItem[]>(EVIDENCE_KEY, [])
  const item = items.find((i) => i.id === id)
  if (!item) return
  item.softDeletedAt = null
  item.updatedAt = new Date().toISOString()
  writeJson(EVIDENCE_KEY, items)
}

export function listExportJobs(): ExportJobRecord[] {
  return readJson<ExportJobRecord[]>(EXPORT_KEY, []).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
}

export function saveExportJob(job: ExportJobRecord): void {
  const jobs = readJson<ExportJobRecord[]>(EXPORT_KEY, [])
  const idx = jobs.findIndex((j) => j.id === job.id)
  if (idx >= 0) jobs[idx] = job
  else jobs.unshift(job)
  writeJson(EXPORT_KEY, jobs)
}

export function deleteExportJob(id: string): void {
  const jobs = readJson<ExportJobRecord[]>(EXPORT_KEY, []).filter((j) => j.id !== id)
  writeJson(EXPORT_KEY, jobs)
}
